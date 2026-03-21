# 01 — Visión General

## ¿Qué es Clover?

Clover es una plataforma de pagos de Fiserv. En LATAM opera con el nombre **Clover** y tiene infraestructura específica en Argentina, Brasil y México.

## Tipos de Integración Disponibles

| Tipo | Descripción | Hardware requerido | Uso en Argentina |
|------|-------------|-------------------|-----------------|
| **Full** | App nativa en dispositivo Clover (Android SDK) | Sí — terminal Clover | ✅ Soportado |
| **Semi-integración REST Pay Display** | Servidor local conectado a terminal Clover vía red local | Sí — terminal Clover | ✅ Soportado |
| **Semi-integración Cloud Pay Display** | Igual al anterior pero vía cloud (no requiere red local) | Sí — terminal Clover | ✅ Soportado |
| **Integración QR** | Pagos sin contacto via QR; usa Android SDK o REST Display | Sí — dispositivo Clover | ✅ Soportado (ver [05-qr-payments.md](./05-qr-payments.md)) |
| **Ecommerce API** (`/v1/charges`) | API REST pura, sin hardware | No | ⚠️ Solo USA/Canadá oficialmente |
| **Hosted Checkout** | Página de pago alojada por Clover | No | ⚠️ Solo USA/Canadá |
| **iframe** | Formulario de pago embebido | No | ⚠️ Solo USA/Canadá |

### Métodos de pago aceptados en Argentina

- Crédito (tarjetas de crédito — Visa, Mastercard, Amex, etc.)
- Débito (tarjetas de débito)
- Billeteras digitales (Mercado Pago, etc.)
- Efectivo
- ATM

## Decisión Arquitectónica para Plur

Para la compra de tokens PLR, necesitamos **cobros online sin hardware físico**. Las opciones son:

### Opción A — Ecommerce API + cuenta LATAM (recomendada para explorar)
Usar `https://api.la.clover.com` con el flujo OAuth estándar e intentar el endpoint `/v1/charges`. Aunque la documentación dice que es USA/Canadá, la infraestructura LATAM puede soportarlo. **Requiere verificar con el equipo comercial de Clover Argentina**.

### Opción B — Hosted Checkout con iframe
Si Clover LATAM habilita esta opción, se puede embeber un formulario de pago de Clover en la interfaz de Plur sin necesidad de manejar datos de tarjeta directamente.

### Opción C — Otra pasarela para Argentina
Si Clover no ofrece una solución API para Argentina sin hardware, considerar:
- **MercadoPago** (nativo en Argentina, con API REST, QR y checkout propio)
- **Decidir** (Banco Galicia — ampliamente usado en Argentina)
- **Payway** (Fiserv Argentina — mismo grupo que Clover)

> **Nota importante:** Payway (de Fiserv) es básicamente el producto de Fiserv para Argentina sin hardware. Dado que Clover también es de Fiserv, puede haber una equivalencia o migración posible entre ambas plataformas.

## Estructura de Entidades

```
Merchant (comercio)
  └── Orders (órdenes)
        └── Charges (cobros)
              └── Refunds (reembolsos)
  └── Customers (clientes con tarjeta guardada)
```

## PCI DSS

| Integración | Responsabilidad PCI |
|-------------|---------------------|
| Ecommerce API pura | Desarrollador debe certificar PCI DSS |
| Hosted Checkout / iframe | Clover maneja PCI; menor carga |
| Remote Pay SDK | Terminal Clover maneja PCI |

Para Plur, la opción más segura es **Hosted Checkout o iframe** para evitar la certificación PCI DSS completa.
