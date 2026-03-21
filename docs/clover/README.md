# Clover Payment API — Documentación para Plur

> Investigación completa sobre la integración de Clover para cobros de tokens en la plataforma Plur.
> Fecha: 2026-03-21

## Índice

| Archivo | Contenido |
|---------|-----------|
| [01-overview.md](./01-overview.md) | Visión general, tipos de integración y decisiones arquitectónicas |
| [02-autenticacion.md](./02-autenticacion.md) | OAuth 2.0, PKCE, tokens de acceso y flujo completo |
| [03-endpoints.md](./03-endpoints.md) | Referencia completa de todos los endpoints con ejemplos |
| [04-argentina.md](./04-argentina.md) | Parámetros específicos de Argentina (ARS, cuotas, CUIT, PFAC) |
| [05-qr-payments.md](./05-qr-payments.md) | Pagos con QR — hallazgos y estado actual |
| [06-sandbox-tests.md](./06-sandbox-tests.md) | Pruebas reales contra el sandbox con resultados |
| [07-integracion-plur.md](./07-integracion-plur.md) | Plan de integración específico para compra de tokens PLR |

## Hallazgo crítico

> ⚠️ **El Ecommerce REST API de Clover (`/v1/charges`) está explícitamente limitado a EEUU y Canadá.**
>
> Para Argentina, Clover usa un modelo diferente: **Remote Pay SDK / REST Pay Display API** que requiere hardware Clover físico o virtual en el punto de venta.
>
> Para cobros online sin hardware Clover, la alternativa es usar la cuenta LATAM (`api.la.clover.com`) con el modelo OAuth + charges, pero se necesita confirmar disponibilidad con el equipo comercial de Clover LATAM.

## URLs clave

```
Sandbox Platform:      https://apisandbox.dev.clover.com
Sandbox Ecommerce:     https://scl-sandbox.dev.clover.com
Sandbox Tokenización:  https://token-sandbox.dev.clover.com
Sandbox OAuth:         https://sandbox.dev.clover.com/oauth/v2/authorize

Prod LATAM Platform:   https://api.la.clover.com
Prod LATAM OAuth:      https://www.la.clover.com/oauth/v2/authorize

Dashboard Sandbox:     https://sandbox.dev.clover.com/developer-home
```

## Cuenta de pruebas

- Email: `contacto@facundopadilla.com`
- Login portal: https://dash.readme.com/to/clover-enterprise-group
