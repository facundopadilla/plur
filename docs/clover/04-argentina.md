# 04 — Argentina: Parámetros y Especificidades

## Contexto

Clover en Argentina opera con un modelo diferente al ecommerce API estándar de North America. Los parámetros Argentina-específicos se pasan via **Remote Pay SDK** en objetos `SaleRequest`, `AuthRequest` y `PreAuthRequest`, a través del campo `regionalExtras`.

## Métodos de pago disponibles

- **Crédito** — tarjetas de crédito (Visa, Mastercard, Amex, Naranja, etc.)
- **Débito** — tarjetas de débito
- **Billeteras** — wallets digitales (Mercado Pago, etc.)
- **Efectivo** — cash
- **ATM**

## Monedas

Argentina soporta esquema **bimonetario**: transacciones en pesos argentinos (ARS) y dólares (USD).

Se selecciona por transacción usando la clave `TX_EXTRA_CURRENCY`:

```python
extras = {
    "com.clover.regionalextras.EXTRA_CURRENCY": "ARS"  # o "USD"
}
```

## Parámetros de `regionalExtras` — Referencia Completa

### Constantes de clave (de `RegionalExtras.java` oficial)

```java
// Selección de moneda
"com.clover.regionalextras.EXTRA_CURRENCY"

// Número de factura fiscal
"com.clover.regionalextras.ar.FISCAL_INVOICE_NUMBER_KEY"
// Valores especiales:
//   - "com.clover.regionalextras.ar.SKIP_FISCAL_INVOICE_NUMBER_SCREEN_VALUE"
//   - "com.clover.regionalextras.ar.CONFIRM_FISCAL_INVOICE_NUMBER_PROVIDED_VALUE"

// Número de cuotas (installments)
"com.clover.regionalextras.ar.INSTALLMENT_NUMBER_KEY"
// Valor default: "1"

// Plan de cuotas
"com.clover.regionalextras.ar.INSTALLMENT_PLAN_KEY"

// ID de merchant (pre-programado en dispositivo)
"com.clover.regionalextras.ar.MERCHANT_ID_KEY"

// Restricción de marca de tarjeta (2 caracteres)
"com.clover.regionalextras.ar.CARD_SYMBOL_KEY"

// Monto de cashback
"com.clover.regionalextras.ar.CASHBACK_AMOUNT_KEY"

// Sub-merchant para PFAC (Payment Facilitator)
"com.clover.regionalextras.ar.SUB_MERCHANT_KEY"

// ID de negocio para redes no bancarias (8 dígitos)
"com.clover.regionalextras.ar.BUSINESS_ID_KEY"

// Nombre dinámico del merchant para redes no bancarias
"com.clover.regionalextras.ar.DYNAMIC_MERCHANT_NAME_KEY"
```

### Tabla de parámetros

| Parámetro | Clave | Tipo | Detalle |
|-----------|-------|------|---------|
| Moneda | `EXTRA_CURRENCY` | String | `"ARS"` o `"USD"` |
| Factura fiscal | `FISCAL_INVOICE_NUMBER_KEY` | String | Formato `nnnn-nnnnnnnn` (ej: `"2024-11061313"`) |
| Cuotas | `INSTALLMENT_NUMBER_KEY` | String (int 1–99) | Default: `"1"` |
| Plan de cuotas | `INSTALLMENT_PLAN_KEY` | String | Identificador del plan |
| ID merchant | `MERCHANT_ID_KEY` | String | UUID alfanumérico 13 chars; debe estar pre-programado en el dispositivo |
| Marca de tarjeta | `CARD_SYMBOL_KEY` | String | 2 chars; restringe a una marca específica |
| Cashback | `CASHBACK_AMOUNT_KEY` | Integer | Monto extra en centavos; requiere habilitación del merchant |
| Sub-merchant (PFAC) | `SUB_MERCHANT_KEY` | Object | Ver estructura abajo |
| ID negocio (redes no bancarias) | `BUSINESS_ID_KEY` | String | 8 dígitos |
| Nombre dinámico (redes no bancarias) | `DYNAMIC_MERCHANT_NAME_KEY` | String | Formato: `[nombreBanco]*[nombreSubMerchant]` |

---

## Estructura del Sub-Merchant (PFAC)

Para integraciones como Payment Facilitator (PFAC):

```json
{
  "regionalExtras": {
    "argentina": {
      "currency": "ARS",
      "subMerchant": {
        "merchantID": "0000000000012",
        "mcc": "4816",
        "legalName": "Plur SRL",
        "address": {
          "address1": "Av. Corrientes 1234",
          "zip": "1043",
          "city": "CABA",
          "country": "ARG"
        },
        "document": {
          "type": "SINGLE_TAX_IDENTIFICATION",
          "number": "30123456789"
        }
      }
    }
  }
}
```

| Campo | Descripción |
|-------|-------------|
| `merchantID` | UUID alfanumérico 13 chars |
| `mcc` | Mastercard: `6051`, Visa: `4829` |
| `legalName` | Razón social de la empresa |
| `address.address1` | Dirección |
| `address.zip` | Código postal |
| `address.city` | Ciudad |
| `address.country` | `"ARG"` |
| `document.type` | `"SINGLE_TAX_IDENTIFICATION"` (CUIT) |
| `document.number` | CUIT de 11 dígitos |

---

## Redes No Bancarias (Visa/Non-Bank Network)

```json
{
  "regionalExtras": {
    "argentina": {
      "businessID": "00000025",
      "dynamicMerchantName": "BancoXXX*PlurSRL"
    }
  }
}
```

---

## Cuotas (Installments)

Clover Argentina soporta pagos en cuotas (1–99).

```python
# Ejemplo: cobro en 12 cuotas, saltear pantalla de factura
extras = {
    "com.clover.regionalextras.ar.INSTALLMENT_NUMBER_KEY": "12",
    "com.clover.regionalextras.ar.FISCAL_INVOICE_NUMBER_KEY":
        "com.clover.regionalextras.ar.SKIP_FISCAL_INVOICE_NUMBER_SCREEN_VALUE"
}
```

Si NO se configura `INSTALLMENT_NUMBER_KEY`, el dispositivo muestra una pantalla para que el cliente elija las cuotas.

---

## Ejemplos de código por SDK

### REST API

```json
{
  "regionalExtras": {
    "currency": "ARS",
    "argentina": {
      "invoiceNumber": "2024-11061313",
      "numInstallments": "12"
    }
  }
}
```

### JavaScript (Node.js / Cloud Pay Display)

```javascript
const saleRequest = new clover.remotepay.SaleRequest();
let extras = {};
extras["com.clover.regionalextras.EXTRA_CURRENCY"] = "ARS";
extras["com.clover.regionalextras.ar.INSTALLMENT_NUMBER_KEY"] = "1";
extras["com.clover.regionalextras.ar.FISCAL_INVOICE_NUMBER_KEY"] =
    "com.clover.regionalextras.ar.SKIP_FISCAL_INVOICE_NUMBER_SCREEN_VALUE";
saleRequest.setRegionalExtras(extras);
cloverConnector.sale(saleRequest);
```

### Java (Android SDK)

```java
SaleRequest saleRequest = new SaleRequest();
saleRequest.setExternalId(ExternalIdUtils.generateNewID());
Map<String, String> extras = new HashMap<>();
extras.put(RegionalExtras.FISCAL_INVOICE_NUMBER_KEY,
    RegionalExtras.SKIP_FISCAL_INVOICE_NUMBER_SCREEN_VALUE);
extras.put(RegionalExtras.INSTALLMENT_NUMBER_KEY,
    RegionalExtras.INSTALLMENT_NUMBER_DEFAULT_VALUE);
extras.put(RegionalExtras.TX_EXTRA_CURRENCY, "ARS");
saleRequest.setRegionalExtras(extras);
```

---

## Notas importantes

1. **`merchantId` debe estar pre-programado en el dispositivo** Clover. Si se pasa un valor inválido, el dispositivo muestra un error.

2. **Habilitación del Dashboard**: El Dashboard del comercio debe tener habilitada la opción "Mostrar pantalla de número de factura" para que aparezca.

3. **Cashback**: Requiere habilitación específica del merchant y que el método de pago lo soporte.

4. **CUIT**: El documento de identificación fiscal en Argentina es el **CUIT** (Código Único de Identificación Tributaria) de 11 dígitos. Se especifica como `"SINGLE_TAX_IDENTIFICATION"`.

5. **Factura fiscal**: El formato es `nnnn-nnnnnnnn` (punto de venta – número de factura). Ejemplo: `"0001-00001234"`.
