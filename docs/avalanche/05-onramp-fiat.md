# 05 — Onramp FIAT: Comprar Créditos con Dinero Real

## El problema

Los usuarios quieren comprar créditos con su tarjeta de crédito/débito o MercadoPago. El resultado final debe ser que el backend mintee la cantidad de PLR correcta a la wallet del usuario.

---

## Opciones evaluadas

| Proveedor | Argentina (ARS) | Método | Integración | Fee estimado |
|-----------|----------------|--------|-------------|-------------|
| **Transak** | ✅ Sí | Tarjeta, MP (vía partners) | Widget/API | 1-3% |
| **MoonPay** | Parcial | Tarjeta (USD) | Widget/API | 4.5% |
| **Ramp Network** | Parcial | Tarjeta | Widget | 2-3% |
| **Layerswap** | No directo | Crypto | API | 0.1-1% |
| **Propio (Clover/MP)** | ✅ Argentina nativo | Tarjeta, MP | Full custom | Sin fee de tercero |

---

## Opción 1: Transak (recomendada para MVP)

Transak es el onramp más fácil de integrar. Ofrece un widget iframe que maneja todo el flujo KYC, pago y entrega de tokens.

### Cómo funciona con Avalanche

```
Usuario → Widget Transak
              ↓
      Elige: "Comprar 100 créditos = ARS 500"
              ↓
      Ingresa datos de tarjeta (maneja Transak)
              ↓
      Transak compra AVAX/PLR en el mercado
              ↓
      Transak envía PLR a la wallet del usuario
              ↓
      Webhook de Transak → Backend → Actualiza balance
```

**Alternativa con PLR custom:** Transak soporta tokens ERC-20 custom en Avalanche una vez verificados. Para el MVP, se puede usar el flow:

```
Transak compra AVAX → Backend convierte AVAX → mintea PLR
```

O más simple (sin Transak involucrado en la blockchain):
```
Transak procesa el pago FIAT → Webhook a Django → Django mintea PLR directamente
```

### Integración del widget en React

```bash
npm install @transak/transak-sdk
```

```tsx
// src/features/credits/components/BuyCreditsModal.tsx
import { Transak } from '@transak/transak-sdk'
import { usePrivy } from '@privy-io/react-auth'

interface BuyCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  creditPackage: { credits: number; priceARS: number }
}

export function BuyCreditsModal({ isOpen, onClose, creditPackage }: BuyCreditsModalProps) {
  const { user } = usePrivy()
  const wallets = useWallets()
  const walletAddress = wallets.wallets[0]?.address

  const openTransak = () => {
    const transak = new Transak({
      apiKey: import.meta.env.VITE_TRANSAK_API_KEY,
      environment: import.meta.env.VITE_TRANSAK_ENV as 'STAGING' | 'PRODUCTION', // STAGING para tests

      // Red y token
      network: 'avalanche',
      defaultCryptoCurrency: 'PLR',  // Si PLR está listado; sino usar 'AVAX'

      // Wallet del usuario (Privy embedded wallet)
      walletAddress: walletAddress,

      // Datos del usuario para pre-llenar
      email: user?.email?.address,
      userData: {
        firstName: '',
        lastName: '',
      },

      // Monto pre-llenado (en FIAT)
      fiatCurrency: 'ARS',
      fiatAmount: creditPackage.priceARS,
      countryCode: 'AR',

      // Personalización (para que se vea como parte de Plur)
      themeColor: '#your-accent-color',
      hideMenu: true,
      disableWalletAddressForm: true, // Usuario no puede cambiar la wallet

      // Webhooks
      partnerOrderId: `plur-${user?.id}-${Date.now()}`,
      partnerCustomerId: user?.id,
    })

    transak.init()

    transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData) => {
      // El webhook de Transak también notificará al backend
      // Aquí podemos mostrar feedback inmediato al usuario
      console.log('Compra exitosa:', orderData)
      onClose()
      // Refrescar balance
    })

    transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
      onClose()
    })
  }

  return (
    <dialog open={isOpen}>
      <h2>Comprar {creditPackage.credits} créditos</h2>
      <p>ARS {creditPackage.priceARS}</p>
      <button onClick={openTransak}>Pagar con tarjeta</button>
    </dialog>
  )
}
```

### Webhook de Transak en Django

```python
# apps/credits/api/webhooks.py

import hmac
import hashlib
from ninja import Router
from django.http import HttpRequest, HttpResponse
from django.conf import settings
from apps.credits.models import CreditTransaction, UserWallet
from apps.credits.services import CreditService

router = Router(tags=["webhooks"])

CREDIT_PACKAGES = {
    100:  {"price_ars": 500},
    500:  {"price_ars": 2000},
    1000: {"price_ars": 3500},
}


@router.post("/webhooks/transak")
async def transak_webhook(request: HttpRequest):
    """
    Recibe notificaciones de Transak cuando una compra de créditos es exitosa.
    Transak notifica con la firma HMAC en el header.
    """
    # Verificar firma
    signature = request.headers.get("X-Transak-Signature", "")
    raw_body = request.body
    expected_sig = hmac.new(
        settings.TRANSAK_WEBHOOK_SECRET.encode(),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(signature, expected_sig):
        return HttpResponse(status=401)

    payload = request.json()

    # Solo procesar órdenes completadas
    if payload.get("status") != "COMPLETED":
        return HttpResponse(status=200)

    order_id = payload.get("id")
    partner_order_id = payload.get("partnerOrderId", "")
    crypto_amount = payload.get("cryptoAmount", 0)
    crypto_currency = payload.get("cryptoCurrency", "")
    wallet_address = payload.get("walletAddress", "")
    fiat_amount = payload.get("fiatAmount", 0)

    # Mapear el monto FIAT a créditos
    # (Transak puede enviar directamente PLR si está configurado,
    #  o AVAX que debemos convertir)
    if crypto_currency == "PLR":
        credits_to_mint = int(crypto_amount)
    else:
        # Calcular créditos basado en el monto FIAT
        # ARS 500 → 100 créditos, ARS 2000 → 500 créditos, etc.
        credits_to_mint = _calculate_credits_from_fiat(fiat_amount)

    if credits_to_mint <= 0:
        return HttpResponse(status=200)

    # Buscar usuario por wallet address
    try:
        user_wallet = await UserWallet.objects.select_related("user").aget(
            address__iexact=wallet_address
        )
    except UserWallet.DoesNotExist:
        return HttpResponse(status=200)  # Silently ignore unknown wallets

    # Mintear créditos
    try:
        tx_hash = CreditService.mint_credits(
            to_wallet=wallet_address,
            amount=credits_to_mint,
            reason="purchase",
            django_reference_id=order_id,
        )

        await CreditTransaction.objects.acreate(
            user=user_wallet.user,
            tx_type=CreditTransaction.TxType.MINT,
            reason=CreditTransaction.Reason.PURCHASE,
            amount=credits_to_mint,
            status=CreditTransaction.Status.CONFIRMED,
            tx_hash=tx_hash,
            wallet_address=wallet_address,
            metadata={
                "transak_order_id": order_id,
                "fiat_amount": fiat_amount,
                "crypto_currency": crypto_currency,
            },
        )

        user_wallet.cached_balance += credits_to_mint
        await user_wallet.asave()

    except Exception as e:
        # Log el error pero retornar 200 para que Transak no reintente infinitamente
        import logging
        logging.error(f"Error procesando webhook Transak: {e}")

    return HttpResponse(status=200)


def _calculate_credits_from_fiat(fiat_amount_ars: float) -> int:
    """Calcula créditos basado en el monto FIAT en ARS."""
    from django.conf import settings
    price_per_100 = settings.PLR_PRICE_ARS_PER_100  # 500
    return int((fiat_amount_ars / price_per_100) * 100)
```

---

## Opción 2: MercadoPago → Mint Manual (Argentina nativo)

Si Transak no está disponible en Argentina o tiene problemas, usar el flow de MercadoPago que ya investigamos con Clover:

```
Usuario → Elige paquete de créditos
              ↓
Backend crea preferencia de pago en MercadoPago
              ↓
Usuario paga con MercadoPago (tarjeta, CBU, MP saldo, Rapipago, etc.)
              ↓
Webhook de MercadoPago → Backend confirma pago
              ↓
Backend mintea PLR a la wallet del usuario
              ↓
Usuario ve créditos actualizados
```

### Ventajas para Argentina

- Acepta todas las formas de pago argentinas: tarjetas locales, cuotas, MercadoPago saldo, QR, Rapipago, Pago Fácil
- Sin KYC adicional (MercadoPago ya tiene el KYC)
- Sin fees de crypto (Plur maneja el precio directamente)
- La relación ARS/créditos la controla Plur completamente

```python
# apps/credits/services/mercadopago_service.py
import mercadopago
from django.conf import settings

sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)

CREDIT_PACKAGES = {
    "100":  {"credits": 100, "price_ars": 500},
    "500":  {"credits": 500, "price_ars": 2000},
    "1000": {"credits": 1000, "price_ars": 3500},
}

def create_payment_preference(user_id: str, package_key: str, wallet_address: str) -> dict:
    """Crea una preferencia de pago de MercadoPago para créditos PLR."""
    package = CREDIT_PACKAGES[package_key]

    preference_data = {
        "items": [{
            "title": f"Plur — {package['credits']} créditos",
            "quantity": 1,
            "unit_price": float(package["price_ars"]),
            "currency_id": "ARS",
        }],
        "external_reference": f"{user_id}|{package_key}|{wallet_address}",
        "notification_url": f"{settings.BACKEND_URL}/api/webhooks/mercadopago",
        "back_urls": {
            "success": f"{settings.FRONTEND_URL}/credits/success",
            "failure": f"{settings.FRONTEND_URL}/credits/failure",
        },
        "auto_return": "approved",
    }

    result = sdk.preference().create(preference_data)
    return result["response"]
```

---

## Opción 3: Compra directa (sin onramp — para el hackathon)

Para el hackathon, el flujo más simple es:

```python
# El "pago" es simulado — solo se mintean créditos al usuario
# En producción, esto iría después de confirmar el pago real

@router.post("/credits/purchase-dev")
async def purchase_credits_dev(request: HttpRequest, credits: int):
    """
    SOLO PARA DESARROLLO — Mintea créditos sin cobrar dinero real.
    Usar con el faucet de Fuji para AVAX.
    """
    if not settings.DEBUG:
        raise HttpError(403, "Solo disponible en desarrollo")

    user = request.auth
    wallet = await UserWallet.objects.aget(user=user)

    tx_hash = CreditService.mint_credits(
        to_wallet=wallet.address,
        amount=credits,
        reason="purchase",
        django_reference_id=str(uuid.uuid4()),
    )

    wallet.cached_balance += credits
    await wallet.asave()

    return {"new_balance": wallet.cached_balance, "tx_hash": tx_hash}
```

---

## Variables de entorno

```env
# Transak
VITE_TRANSAK_API_KEY=your_transak_api_key    # Frontend
VITE_TRANSAK_ENV=STAGING                      # STAGING o PRODUCTION
TRANSAK_API_KEY=your_transak_api_key          # Backend (mismo, para verificar)
TRANSAK_WEBHOOK_SECRET=your_webhook_secret

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=TEST-...   # Test token desde developers.mercadopago.com

# General
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

---

## Comparación de flows para Argentina

| Flow | Pros | Contras | Recomendación |
|------|------|---------|---------------|
| Transak | Widget listo, soporta AVAX | Fees ~3%, KYC, menos formas de pago AR | Prod internacional |
| MercadoPago | Todas las formas de pago AR, cuotas | Más código, no entrega crypto directamente | **Prod Argentina** |
| Dev mock | 0 código extra | Solo para testing | **Hackathon/dev** |

Para el hackathon: usar el flow de dev mock.
Para producción en Argentina: MercadoPago como gateway + backend mintea PLR.
