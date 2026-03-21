# 07 — Plan de Integración para Plur

## Objetivo

Permitir que los usuarios de Plur compren **tokens PLR** pagando con tarjeta de crédito/débito, a través de una pasarela de pago integrada en el backend Django.

## Análisis de viabilidad con Clover

### Problema principal

El Ecommerce API de Clover (`/v1/charges`) está documentado **oficialmente solo para USA y Canadá**. Argentina usa el Remote Pay SDK que requiere hardware Clover físico.

### Opciones evaluadas

| Opción | Viabilidad | Tiempo de implementación | Recomendación |
|--------|-----------|-------------------------|---------------|
| **Clover Ecommerce API en LATAM** | Posible pero requiere confirmación | 2-3 semanas | Consultar con equipo Clover LATAM antes de invertir tiempo |
| **MercadoPago** | ✅ Alta — nativo Argentina | 1-2 semanas | ⭐ Recomendado para producción rápida |
| **Clover con hardware** | ✅ Alta — pero requiere hardware | Meses | Solo si Plur abre punto de venta físico |
| **Payway (Fiserv Argentina)** | ✅ Alta — API REST, mismo grupo que Clover | 2-3 semanas | Alternativa sólida |

### Decisión recomendada

Para lanzar rápido: **MercadoPago**. Luego, si el equipo comercial de Clover LATAM confirma disponibilidad de su Ecommerce API para Argentina, se puede migrar o agregar como segundo proveedor.

---

## Flujo de compra de tokens con Clover (si se habilita para LATAM)

```
Usuario hace click en "Comprar tokens"
         ↓
Frontend muestra iframe/formulario de tarjeta (Clover JS SDK)
         ↓
JS SDK tokeniza la tarjeta → token clv_1XXXX
         ↓
Frontend envía token + cantidad al backend
         ↓
Backend Django POST /v1/charges con el token
         ↓
Clover responde con charge_id + status
         ↓
Si status == "succeeded":
    Acreditar tokens PLR al usuario en BD
    Registrar transacción
    Webhook de confirmación (optional)
         ↓
Si falla:
    Devolver error al frontend
    NO acreditar tokens
```

---

## Implementación backend (Django)

### Modelo de datos sugerido

```python
# apps/payments/models.py

class TokenPurchase(models.Model):
    """Registro de compra de tokens PLR."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        SUCCEEDED = "succeeded", "Exitoso"
        FAILED = "failed", "Fallido"
        REFUNDED = "refunded", "Reembolsado"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    amount_ars = models.DecimalField(max_digits=12, decimal_places=2)
    tokens_purchased = models.PositiveIntegerField()
    clover_charge_id = models.CharField(max_length=50, blank=True)
    clover_ref_num = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    idempotency_key = models.UUIDField(unique=True, default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict)
```

### Servicio de pagos

```python
# apps/payments/services.py

import uuid
import httpx
from django.conf import settings
from loguru import logger


class CloverPaymentService:
    """Servicio para procesar pagos via Clover Ecommerce API."""

    BASE_URL = settings.CLOVER_ECOMMERCE_URL  # https://scl-sandbox.dev.clover.com en dev

    @classmethod
    async def charge(
        cls,
        amount_cents: int,
        currency: str,
        card_token: str,
        description: str,
        idempotency_key: str,
        metadata: dict | None = None,
        receipt_email: str | None = None,
    ) -> dict:
        """
        Crear un cobro via Clover.

        Args:
            amount_cents: Monto en centavos (ARS 1000.00 = 100000)
            currency: ISO 4217 en minúsculas ('ars', 'usd')
            card_token: Token clv_* generado en el cliente
            description: Descripción del cobro
            idempotency_key: UUID para evitar cobros duplicados
            metadata: Datos extra (user_id, token_package, etc.)
            receipt_email: Email para enviar recibo

        Returns:
            dict con charge_id, status, ref_num

        Raises:
            PaymentError: Si el cobro falla
        """
        payload = {
            "amount": amount_cents,
            "currency": currency,
            "source": card_token,
            "capture": True,
            "ecomind": "ecom",
            "description": description,
        }

        if receipt_email:
            payload["receipt_email"] = receipt_email
        if metadata:
            payload["metadata"] = metadata

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{cls.BASE_URL}/v1/charges",
                headers={
                    "Authorization": f"Bearer {settings.CLOVER_ACCESS_TOKEN}",
                    "Content-Type": "application/json",
                    "idempotency-key": idempotency_key,
                },
                json=payload,
                timeout=30.0,
            )

        if response.status_code == 200:
            data = response.json()
            logger.info(
                "Cobro exitoso",
                charge_id=data["id"],
                amount=amount_cents,
                currency=currency,
            )
            return data
        else:
            error_data = response.json()
            logger.error(
                "Cobro fallido",
                status_code=response.status_code,
                error=error_data,
            )
            raise PaymentError(
                code=error_data.get("error", {}).get("code", "unknown"),
                message=error_data.get("error", {}).get("message", "Error de pago"),
            )


class PaymentError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)
```

### Endpoint Django Ninja

```python
# apps/payments/api/endpoints.py

from ninja import Router
from django.http import HttpRequest
from apps.payments.services import CloverPaymentService, PaymentError
from apps.payments.models import TokenPurchase

router = Router(tags=["payments"])


class BuyTokensIn(Schema):
    card_token: str        # clv_* token del frontend
    token_package: int     # cantidad de tokens: 100, 500, 1000
    receipt_email: str | None = None


class BuyTokensOut(Schema):
    charge_id: str
    tokens_credited: int
    new_balance: int


TOKEN_PACKAGES = {
    100:  {"price_ars": 500_00,  "tokens": 100},   # ARS 500
    500:  {"price_ars": 2000_00, "tokens": 500},   # ARS 2000
    1000: {"price_ars": 3500_00, "tokens": 1000},  # ARS 3500
}


@router.post("/tokens/buy", response={200: BuyTokensOut, 400: ErrorOut, 402: ErrorOut})
async def buy_tokens(request: HttpRequest, payload: BuyTokensIn):
    """Comprar tokens PLR con tarjeta de crédito/débito."""
    user = request.auth
    package = TOKEN_PACKAGES.get(payload.token_package)

    if not package:
        return 400, {"detail": "Paquete de tokens inválido"}

    # Crear registro de compra pendiente
    purchase = await TokenPurchase.objects.acreate(
        user=user,
        amount_ars=package["price_ars"] / 100,
        tokens_purchased=package["tokens"],
        status=TokenPurchase.Status.PENDING,
        metadata={"token_package": payload.token_package},
    )

    try:
        charge = await CloverPaymentService.charge(
            amount_cents=package["price_ars"],
            currency="ars",
            card_token=payload.card_token,
            description=f"Plur — {package['tokens']} tokens PLR",
            idempotency_key=str(purchase.idempotency_key),
            metadata={"user_id": str(user.id), "purchase_id": str(purchase.id)},
            receipt_email=payload.receipt_email,
        )

        # Acreditar tokens
        await user.token_balance.acreate_or_add(package["tokens"])

        # Actualizar registro
        purchase.clover_charge_id = charge["id"]
        purchase.clover_ref_num = charge.get("ref_num", "")
        purchase.status = TokenPurchase.Status.SUCCEEDED
        await purchase.asave()

        return 200, {
            "charge_id": charge["id"],
            "tokens_credited": package["tokens"],
            "new_balance": await user.get_token_balance(),
        }

    except PaymentError as e:
        purchase.status = TokenPurchase.Status.FAILED
        await purchase.asave()

        if e.code in ("card_declined", "expired_card", "incorrect_number"):
            return 402, {"detail": e.message}
        return 400, {"detail": "Error al procesar el pago. Intentá de nuevo."}
```

---

## Variables de entorno necesarias

```env
# Sandbox
CLOVER_ECOMMERCE_URL=https://scl-sandbox.dev.clover.com
CLOVER_ACCESS_TOKEN=ab86a5e8-48f3-b3bd-8c45-d415e9867833
CLOVER_APP_ID=your_app_id
CLOVER_APP_SECRET=your_app_secret
CLOVER_MERCHANT_ID=your_merchant_id

# Producción LATAM
# CLOVER_ECOMMERCE_URL=https://scl.clover.com  (o la URL LATAM si se confirma)
# CLOVER_ACCESS_TOKEN=prod_access_token
```

---

## Integración del iframe en Frontend

```tsx
// src/features/payments/components/CloverPaymentForm.tsx

useEffect(() => {
  // Cargar Clover JS SDK
  const script = document.createElement('script')
  script.src = 'https://checkout.sandbox.dev.clover.com/sdk.js'
  document.head.appendChild(script)

  script.onload = () => {
    const clover = new window.Clover(PAKMS_PUBLIC_KEY, {
      merchantId: MERCHANT_ID
    })
    const elements = clover.elements()

    const cardNumber = elements.create('CARD_NUMBER')
    const cardDate = elements.create('CARD_DATE')
    const cardCvv = elements.create('CARD_CVV')

    cardNumber.mount('#card-number')
    cardDate.mount('#card-date')
    cardCvv.mount('#card-cvv')

    // Al submit:
    clover.createToken().then(result => {
      if (!result.errors) {
        // Enviar result.token al backend
        handlePayment(result.token)
      }
    })
  }
}, [])
```

---

## Webhooks para confirmación asíncrona

Aunque el flujo síncrono (`await charge`) debería ser suficiente para la mayoría de los casos, los webhooks dan una segunda capa de seguridad.

### Configuración en Dashboard

1. Developer Dashboard → App Settings → Webhooks
2. HTTPS URL: `https://api.plur.app/webhooks/clover`
3. Verificar con el código que Clover envía
4. Seleccionar evento: `P` (Payments)

### Handler en Django

```python
# apps/payments/api/webhooks.py

@router.post("/webhooks/clover")
async def clover_webhook(request: HttpRequest):
    """Recibir notificaciones de pago de Clover."""
    # Validar header de autenticación
    auth_code = request.headers.get("X-Clover-Auth")
    if auth_code != settings.CLOVER_WEBHOOK_AUTH_CODE:
        return HttpResponse(status=401)

    payload = request.json()
    for merchant_id, events in payload.get("merchants", {}).items():
        for event in events:
            if event["objectId"].startswith("P:"):
                payment_id = event["objectId"].split(":")[1]
                await handle_payment_event(payment_id, event["type"])

    return HttpResponse(status=200)
```

---

## Preguntas pendientes con equipo Clover LATAM

Antes de implementar con Clover, confirmar:

1. ✅ ¿Está disponible el endpoint `/v1/charges` para merchants de Argentina?
2. ✅ ¿Cuál es la URL base del Ecommerce Service para LATAM? (`scl.la.clover.com`?)
3. ✅ ¿La tokenización (`token-sandbox.dev.clover.com`) funciona para tarjetas argentinas (Visa/Mastercard local)?
4. ✅ ¿Se puede usar el iframe/Hosted Checkout en Argentina?
5. ✅ ¿Cuáles son los costos por transacción para LATAM?

**Contacto:** Formulario de contacto en `https://docs.clover.com` o portal de desarrolladores.
