# 05 — Pagos con QR

## Estado actual de la investigación

> **Hallazgo crítico:** No existe un endpoint REST público documentado para generar QR codes de pago via Clover en Argentina. El QR en Argentina está ligado al hardware Clover (dispositivos físicos con Android SDK o REST Pay Display API).

## Lo que encontramos

### Referencia en documentación LATAM

La página principal de guías para desarrolladores LATAM Argentina (`/quick-reference-guides-latam-developers`) lista explícitamente:

```
Integración QR → Android SDK + REST Display API
```

Esto confirma que existe una integración QR, pero está ligada a los SDKs de dispositivo, no a una API REST pura.

### Lo que NO existe (confirmado con 404)

- `https://docs.clover.com/dev/docs/qr-payments` → **404**
- `https://docs.clover.com/dev/docs/payment-methods-latam` → **404**
- `https://docs.clover.com/dev/docs/clover-go-pay-with-qr` → **404** (páginas de login requerido)

### Implicación para Plur

El QR de Clover es generado **por el dispositivo terminal Clover** (hardware), no por una API REST que se pueda invocar desde un servidor Django. El flujo sería:

```
Dispositivo Clover (terminal física)
    ↓ genera QR dinámico
Cliente escanea con app (Mercado Pago, CBU, tarjeta, etc.)
    ↓ pago procesado por la red
Clover recibe confirmación
    ↓ webhook a nuestro backend
Plur acredita tokens al usuario
```

---

## Alternativas para QR en Argentina SIN hardware Clover

### Opción 1 — MercadoPago QR (recomendada)

MercadoPago ofrece una API REST nativa para QR codes estáticos y dinámicos. Es la pasarela más adoptada en Argentina.

```python
import requests

# Crear orden de pago con QR dinámico
response = requests.post(
    'https://api.mercadopago.com/merchant_orders',
    headers={'Authorization': f'Bearer {ACCESS_TOKEN}'},
    json={
        'external_reference': 'PLR-ORDER-001',
        'notification_url': 'https://api.plur.app/webhooks/mp',
        'items': [{
            'title': '100 Tokens PLR',
            'quantity': 1,
            'unit_price': 10000.00,
            'currency_id': 'ARS'
        }]
    }
)
qr_data = response.json()['qr']  # datos para generar QR
```

### Opción 2 — Payway (Fiserv Argentina — mismo grupo que Clover)

Payway es el producto de Fiserv para Argentina que sí ofrece API REST para pagos online. Al ser del mismo grupo corporativo que Clover, puede haber puentes o equivalencias.

URL: https://www.payway.com.ar/developers

### Opción 3 — Decidir (Banco Galicia)

API REST para procesamiento de tarjetas en Argentina, ampliamente adoptada.
URL: https://decidir.com.ar/developers

---

## Flujo de QR con Clover (si se tiene hardware)

Si Plur en el futuro tiene un punto de venta físico con terminal Clover:

```
1. App de Plur en Android SDK Clover → SaleRequest con RegionalExtras
2. Terminal muestra QR code en pantalla
3. Cliente escanea con su app/billetera
4. Clover procesa el pago
5. Webhook de Clover notifica a backend de Plur
6. Plur acredita tokens
```

### Webhook de pago completado

```json
{
  "appId": "XXXXXXXXXXXXXX",
  "merchants": {
    "MERCHANT_ID": [
      {
        "objectId": "P:PAYMENT_ID",
        "type": "UPDATE",
        "ts": 1742521200000
      }
    ]
  }
}
```

Con `objectId` = `"P:{paymentId}"`, se consulta:
```
GET https://apisandbox.dev.clover.com/v3/merchants/{mId}/payments/{paymentId}
Authorization: Bearer {access_token}
```

---

## Conclusión y Recomendación

| Escenario | Solución recomendada |
|-----------|---------------------|
| QR sin hardware, Argentina | **MercadoPago QR API** (nativa, amplia adopción) |
| QR con terminal Clover | **Android SDK + REST Display API** (documentación interna Clover) |
| Tarjeta online sin hardware | **Clover Ecommerce API** (confirmar disponibilidad en LATAM) o **Payway/Decidir** |
| Máxima compatibilidad Argentina | **MercadoPago** para QR + **Decidir/Payway** para tarjeta |

Para Plur específicamente, si el objetivo es que usuarios compren tokens PLR desde la app (sin hardware), la integración más rápida y nativa para Argentina es **MercadoPago**, que tiene SDK Python, webhook robusto, y maneja QR, tarjeta, y billetera en una sola API.
