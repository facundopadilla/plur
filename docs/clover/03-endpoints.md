# 03 — Referencia de Endpoints

## URLs base

| Servicio | Sandbox | Producción |
|----------|---------|------------|
| Platform API | `https://apisandbox.dev.clover.com` | `https://api.clover.com` / `https://api.la.clover.com` |
| Ecommerce Service | `https://scl-sandbox.dev.clover.com` | `https://scl.clover.com` |
| Tokenización | `https://token-sandbox.dev.clover.com` | `https://token.clover.com` |
| PAKMS | `https://scl-sandbox.dev.clover.com/pakms/apikey` | `https://scl.clover.com/pakms/apikey` |

---

## 1. Tokenización de tarjeta

### POST `/v1/tokens`

Convierte datos de tarjeta en un token de un solo uso (`clv_*`). Se llama desde el **cliente** (browser/app).

**URL:** `https://token-sandbox.dev.clover.com/v1/tokens`
**Auth:** Header `apikey: {apiAccessKey}` (clave pública de PAKMS — NO el access_token)

**Request:**
```json
{
  "card": {
    "number": "4242424242424242",
    "exp_month": "12",
    "exp_year": "2026",
    "cvv": "123",
    "name": "Juan Pérez"
  }
}
```

**Response 200:**
```json
{
  "id": "clv_1AAAAAAbCdefJK2l3MnoPQ4r",
  "object": "token",
  "card": {
    "brand": "VISA",
    "exp_month": "12",
    "exp_year": "2026",
    "first6": "424242",
    "last4": "4242"
  }
}
```

**Response 401 (apikey inválida — resultado de prueba real):**
```json
{"message": "401 Unauthorized"}
```

---

## 2. Cobros (Charges)

### POST `/v1/charges`

Crea un cobro inmediato o pre-autorización.

**URL:** `https://scl-sandbox.dev.clover.com/v1/charges`
**Auth:** `Authorization: Bearer {access_token}`
**Headers adicionales recomendados:**
- `idempotency-key: {uuid4}` — previene cobros duplicados
- `x-forwarded-for: {client_ip}` — para antifraude

**Request mínimo:**
```json
{
  "amount": 100000,
  "currency": "ars",
  "source": "clv_1AAAAAAbCdefJK2l3MnoPQ4r"
}
```

**Request completo:**
```json
{
  "amount": 100000,
  "currency": "ars",
  "source": "clv_1AAAAAAbCdefJK2l3MnoPQ4r",
  "capture": true,
  "ecomind": "ecom",
  "description": "Compra 100 tokens PLR",
  "receipt_email": "usuario@ejemplo.com",
  "external_reference_id": "PLR-TX-001",
  "tax_amount": 0,
  "metadata": {
    "user_id": "123",
    "token_package": "100"
  }
}
```

**Campos del request:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `amount` | int64 | ✅ | En centavos (ARS 1000.00 = `100000`) |
| `currency` | string | ✅ | ISO 4217 minúsculas: `"ars"` o `"usd"` |
| `source` | string | ✅ | Token `clv_*` o `"alternate_tender"` |
| `capture` | boolean | — | `true` = cobro inmediato (default), `false` = pre-autorización |
| `ecomind` | string | — | `"ecom"` (cliente ingresa) o `"moto"` (operador ingresa) |
| `description` | string | — | Descripción del cobro |
| `external_reference_id` | string | — | Referencia externa, máx 12 chars alfanuméricos |
| `receipt_email` | string | — | Email para enviar recibo |
| `tax_amount` | int64 | — | Impuestos en centavos |
| `tip_amount` | int64 | — | Propina en centavos |
| `metadata` | object | — | Datos custom, máx 500 chars total |
| `soft_descriptor` | object | — | Nombre alternativo en el resumen de tarjeta |
| `stored_credentials` | object | — | Para pagos recurrentes o tarjeta guardada |
| `threeds_authentication_result` | object | — | Datos de autenticación 3D Secure |

**Response 200 (éxito):**
```json
{
  "id": "2G1RQC0VTH7WY",
  "amount": 100000,
  "payment_method_details": "card",
  "amount_refunded": 0,
  "currency": "ars",
  "created": 1742521200000,
  "captured": true,
  "ref_num": "116400500490",
  "auth_code": "OK4447",
  "outcome": {
    "network_status": "approved_by_network",
    "type": "authorized"
  },
  "paid": true,
  "status": "succeeded",
  "source": {
    "id": "clv_1AAAAAAbCdefJK2l3MnoPQ4r",
    "brand": "VISA",
    "exp_month": 12,
    "exp_year": 2026,
    "first6": 424242,
    "last4": 4242
  },
  "ecomind": "ecom"
}
```

**Response 400 (tarjeta rechazada):**
```json
{
  "error": {
    "charge": "2G1RQC0VTH7WY",
    "code": "card_declined",
    "decline_code": "do_not_honor",
    "doc_url": "https://docs.clover.com/...",
    "message": "The card was declined.",
    "param": "source",
    "type": "card_error"
  }
}
```

---

### POST `/v1/charges/{chargeId}/capture`

Captura un cobro pre-autorizado.

```bash
curl -X POST https://scl-sandbox.dev.clover.com/v1/charges/2G1RQC0VTH7WY/capture \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json"
```

---

### GET `/v1/charges/{chargeId}`

Consulta el estado de un cobro.

---

## 3. Reembolsos

### POST `/v1/refunds`

**URL:** `https://scl-sandbox.dev.clover.com/v1/refunds`

**Request (reembolso parcial):**
```json
{
  "charge": "2G1RQC0VTH7WY",
  "amount": 50000
}
```

**Request (reembolso total — omitir amount):**
```json
{
  "charge": "2G1RQC0VTH7WY"
}
```

---

## 4. Órdenes

### POST `/v1/orders`

```json
{
  "currency": "ars",
  "customer": "{customer_uuid}",
  "email": "usuario@ejemplo.com",
  "items": [
    {
      "amount": 100000,
      "currency": "ars",
      "description": "Pack 100 tokens PLR",
      "quantity": 1,
      "type": "sku"
    }
  ]
}
```

### POST `/v1/orders/{orderId}/pay`

```json
{
  "ecomind": "ecom",
  "customer": "{customer_uuid}"
}
```

---

## 5. Clientes (Card-on-file)

### POST `/v1/customers`

Guarda tarjeta para cobros futuros.

```json
{
  "email": "usuario@plur.app",
  "source": "clv_1AAAAAAbCdefJK2l3MnoPQ4r"
}
```

**Respuesta incluye un `customerId` que se usa en cobros futuros.**

---

## 6. Platform API

**Base:** `https://apisandbox.dev.clover.com/v3/merchants/{mId}`

| Endpoint | Descripción |
|----------|-------------|
| `GET /v3/merchants/{mId}` | Info del comercio |
| `GET /v3/merchants/{mId}?expand=tenders` | Métodos de pago disponibles |
| `GET /v3/merchants/{mId}/tax_rates` | Tasas de impuesto configuradas |
| `GET /v3/merchants/{mId}/customers` | Clientes del comercio |
| `GET /v3/merchants/{mId}/payments` | Historial de pagos |

---

## Códigos de error

| Código HTTP | Significado |
|-------------|-------------|
| 200 | Éxito |
| 400 | Request inválido / tarjeta rechazada |
| 401 | Sin autenticación o token inválido |
| 404 | Recurso no encontrado |
| 429 | Rate limit superado |
| 500 | Error interno de Clover |

### Códigos de error específicos (`error.code`)

| Code | Descripción | Acción |
|------|-------------|--------|
| `card_declined` | Tarjeta rechazada | Pedir otro método de pago |
| `expired_card` | Tarjeta vencida | Pedir nueva tarjeta |
| `incorrect_number` | Número de tarjeta inválido | Pedir nueva tarjeta |
| `invalid_cvc` | CVV inválido | Reintentar |
| `token_already_used` | Token de un solo uso ya usado | Generar nuevo token |
| `processing_error` | Error genérico de procesamiento | Reintentar |
| `rate_limit` | Demasiadas peticiones | Esperar y reintentar |
| `amount_too_large` | Monto supera el máximo ($999,999.99) | Dividir transacción |
| `order_already_paid` | Orden ya pagada | No reintentar |
