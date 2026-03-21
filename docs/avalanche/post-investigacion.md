# Post-investigación — Auditoría crítica de `docs/avalanche` (Mar 2026)

## 1) Alcance y método

Se revisó la documentación existente en:

- `docs/avalanche/README.md`
- `docs/avalanche/01-arquitectura.md`
- `docs/avalanche/02-smart-contracts.md`
- `docs/avalanche/03-abstraccion-usuario.md`
- `docs/avalanche/04-backend-django.md`
- `docs/avalanche/05-onramp-fiat.md`
- `docs/avalanche/06-tokenomics.md`
- `docs/avalanche/07-fuji-testnet.md`

Y se contrastó con fuentes externas (oficiales y de referencia técnica) para detectar supuestos desactualizados, riesgos de monetización y deuda técnica.

---

## 2) Resumen ejecutivo

La investigación base está bien orientada para MVP, pero tiene **brechas críticas** en tres ejes:

1. **Monetización con control de riesgo insuficiente** (falta de idempotencia, conciliación y manejo de refund/chargeback/disputas).
2. **Reglas de emisión/liberación de tokens incompletas** (no está formalizado el criterio “venta concretada” con máquina de estados y clawback).
3. **Tokenómica no aterrizada al caso textil USD en Argentina** (no existe un índice de telas formal, ni metodología de pricing anti-manipulación).

Además, hay actualizaciones de Avalanche que conviene incorporar explícitamente (ACP-125/176/226 y modelo L1 post-Etna) para evitar decisiones de arquitectura basadas en supuestos viejos.

---

## 3) Falencias detectadas en la investigación actual

## 3.1 Red/Avalanche: faltan actualizaciones de protocolo y operación

### Hallazgos

- La documentación no integra explícitamente cambios recientes de costos y dinámica de bloque:
  - **ACP-125**: reducción de min base fee C-Chain de 25 nAVAX a 1 nAVAX.
  - **ACP-176**: actualización dinámica de objetivo de gas y price discovery.
  - **ACP-226**: delay mínimo dinámico entre bloques.
- Falta aclarar alcance: estos supuestos deben documentarse como **C-Chain / EVM chains donde el upgrade esté activado**, no como regla universal para toda red Avalanche.
- Se menciona C-Chain vs Subnet/L1, pero falta precisar el modelo post-Etna:
  - Validadores de **L1-only** no requieren stake de 2000 AVAX; pagan fee dinámico mensual (valor inicial referencial ~1.33 AVAX/mes, sujeto a parámetros de red).

### Riesgo

- Sobre/infraestimación de costos y rendimiento.
- Decisiones incorrectas de “cuándo migrar a L1” por información incompleta.

### Mejora

- Añadir una sección de “supuestos vigentes” versionada por fecha, con links a ACPs activados.

---

## 3.2 Tokenómica: hoy está definida como narrativa, no como sistema controlable

### Hallazgos

- `06-tokenomics.md` define precios y APY, pero no formaliza:
  - Política de reservas/tesorería y límites de emisión operativa.
  - Métrica de insolvencia económica del sistema (pasivo en PLR vs caja/ingresos).
  - Escenarios de stress (caída ventas, suba costo telas USD, ola de refunds).
- Se asume emisión “on-demand” sin una gobernanza de parámetros robusta (timelock/multisig para cambios críticos).

### Riesgo

- Inflación de PLR sin trazabilidad de causa.
- Desalineación entre valor percibido de crédito y costo real del negocio.

### Mejora

- Definir una **política monetaria operativa** con límites diarios/semanales por fuente de emisión y gatillos de pausa.

---

## 3.3 Monetización transaccional: falta modelado de “venta concretada”

### Hallazgos

- El concepto “si no hay venta, no hay tokens” aparece a nivel textual, pero no está modelado como flujo transaccional duro.
- No hay estado canónico de orden para rewards:
  - `created`, `authorized`, `captured`, `delivered`, `return_window_closed`, `reward_released`.
- No está definido qué pasa si ya se liberó reward y luego hay:
  - devolución,
  - contracargo,
  - fraude,
  - disputa resuelta contra vendedor.

### Riesgo

- Emisión indebida de tokens.
- Doble acreditación por reintentos de webhook.
- Pérdidas directas por no clawbackear rewards tras reversas.

### Mejora

- Implementar **máquina de estados de liquidación** + reglas de idempotencia + clawback.

---

## 3.4 Integraciones de pago/webhooks: controles incompletos

### Hallazgos

- Faltan controles explícitos de:
  - idempotency key por evento de proveedor,
  - deduplicación por `provider_event_id` único,
  - reconciliación periódica PSP ↔ ledger interno ↔ blockchain.
- En la guía se propone devolver `200` ante errores para evitar reintentos infinitos; sin compensación robusta esto puede “perder” acreditaciones válidas.

### Riesgo

- Double-mint o mint perdido.
- Contabilidad inconsistente y difícil de auditar.

### Mejora

- Política de webhook resiliente:
  - responder 2xx solo si el evento quedó persistido,
  - procesar asíncronamente,
  - reintentos idempotentes,
  - DLQ (dead-letter queue) para incidentes.

---

## 3.5 Cumplimiento/regulatorio (Argentina): debe explicitarse mejor

### Hallazgos

- La documentación no integra con claridad el marco PSAV/CNV en la narrativa de operación y riesgos.
- Falta separar lenguaje de “utility crédito” vs lenguaje que pueda sonar a promesa de inversión.

### Riesgo

- Riesgo legal/comercial por comunicación ambigua del token.

### Mejora

- Incorporar sección de “cumplimiento mínimo operativo” en docs:
  - registro/obligaciones aplicables,
  - disclaimer de alcance,
  - controles AML/KYT/KYC según flujo.

> Nota: este documento no reemplaza asesoría legal.

---

## 3.6 Riesgo de diseño en contratos (según investigación actual)

### Hallazgos

- En la propuesta de `PLRToken` documentada, el `burnFrom` del `BURNER_ROLE` quema directo vía `_burn(from, amount)`.
- El texto sugiere que “requiere aprobación del usuario”, pero con esa implementación no se valida allowance del usuario.

### Riesgo

- Si el backend con `BURNER_ROLE` se compromete o falla su lógica, puede quemar saldo de usuarios sin aprobación explícita.

### Mejora

- Documentar de forma coherente la semántica real (custodial) **o** rediseñar para exigir autorización criptográfica/allowance por operación.

---

## 4) Propuesta concreta para tu idea: $PLR atado al valor USD de telas

Tu idea es viable, pero requiere diseño anti-manipulación y redacción regulatoria prudente.

### Antes de la fórmula: regla de comunicación

- Evitar en docs frases tipo “peg garantizado” o “redención asegurada”.
- Formularlo como: **“el pricing de PLR puede usar referencias de precios textiles en USD definidas por política de plataforma”**.
- Para MVP, tratarlo como **pricing service off-chain** con trazabilidad (no necesariamente oráculo on-chain para textil).

Propuesta:

## 4.1 Definir un índice textil (`ITX_USD`)

- Construir una canasta de telas relevantes al negocio (ejemplo: algodón, denim, poliéster).
- Cada componente con:
  - proveedor/fuente,
  - peso,
  - frecuencia de actualización,
  - regla de calidad de dato.
- Calcular un índice diario en USD (con TWAP/mediana) para suavizar ruido.

Para MVP:

- calcular `ITX_USD` off-chain,
- firmar snapshot de precio (`price_version`, `timestamp`, `expiry`),
- congelar snapshot al momento de confirmar la orden para evitar cambios retroactivos.

## 4.2 Fórmula de precio de PLR (simple y trazable)

Sea:

- `ITX_t`: índice textil USD actual
- `ITX_0`: índice base
- `PLR_USD_0`: precio base inicial de 1 PLR en USD

Entonces:

```text
PLR_USD_teorico_t = PLR_USD_0 * (ITX_t / ITX_0)
PLR_USD_t = clamp(PLR_USD_teorico_t, PLR_USD_{t-1} * 0.95, PLR_USD_{t-1} * 1.05)
```

Esto limita saltos diarios extremos (ejemplo ±5%).

## 4.3 Conversión de reward por venta

```text
sale_usd = valor_venta_en_usd
reward_usd = sale_usd * tasa_reward
reward_plr = reward_usd / PLR_USD_t
```

Así el reward refleja costo real de telas en USD y no queda “desanclado”.

Agregar unidad de cuenta canónica en cada orden:

- `quote_currency` (USD/ARS),
- `fx_source`,
- `fx_timestamp`,
- `price_snapshot_id`.

Sin snapshot versionado, la conciliación posterior se vuelve frágil.

## 4.4 Regla obligatoria de liberación (tu requisito)

**No se liberan tokens por “intento de venta” ni por “pago iniciado”.**

Solo se libera en:

```text
order.status == DELIVERED
AND return_window_closed == true
AND payment.status == SETTLED
AND fraud_flag == false
AND chargeback_window_closed == true
```

Si no se cumple todo: `reward_plr = 0` (o queda bloqueado en escrow sin release).

## 4.5 Clawback obligatorio

Si la venta se revierte después de liberar:

- quemar reward no gastado,
- o registrar saldo negativo/retención futura,
- o ejecutar penalización al vendedor según política.

Sin clawback, el modelo se rompe económicamente ante chargebacks/refunds.

---

## 5) Diseño mínimo recomendado (MVP vs Producción)

| Capa | MVP (rápido y seguro) | Producción (robusto) |
|---|---|---|
| Pricing de PLR | Índice textil calculado off-chain 1 vez/día + snapshot firmado | Multi-fuente (pricing service + oracle para feeds externos) + fallback + monitoreo |
| Rewards | Ledger interno + release diferido por estado de orden | Escrow/vesting on-chain + eventos auditables |
| Webhooks PSP | Verificación firma + idempotencia + cola async | Idem + DLQ + replay tooling + SLOs |
| Riesgo fraude | Límites por usuario/orden y revisión manual | Motor antifraude con score y reglas dinámicas |
| Contabilidad | Doble asiento básico + conciliación diaria | Conciliación automática intradía + alertas |
| Gobernanza parámetros | Multisig para cambios críticos | Multisig + timelock + runbook de emergencia |

---

## 6) Deuda técnica de monetización a resolver sí o sí

1. **Idempotencia end-to-end**
   - Claves por operación (`order_id`, `provider_event_id`, `reference_id`).
2. **Ledger de doble entrada**
   - Cada emisión/quema/liberación debe tener contrapartida contable.
3. **Conciliación automática**
   - PSP vs base interna vs on-chain (si aplica).
4. **Máquina de estados de órdenes/pagos**
   - Estado único de verdad para habilitar release de rewards.
5. **Política de reversas**
   - Refund/chargeback/disputa con clawback definido.
6. **Circuit breakers**
   - Pausa de emisión si hay desvío de pricing, feed stale o anomalía de fraude.
7. **Observabilidad**
   - Dashboards + alertas (tasa de error webhook, doble evento, mismatches ledger).
8. **Controles de privilegios de contrato**
   - Separación de roles críticos, pausas de emergencia, límites de emisión y auditoría de acciones de backend wallet.

---

## 6.1 Redacción recomendada para bajar riesgo regulatorio

Preferir:

- “créditos de uso interno” / “reward program”
- “referencia de precio” / “pricing de plataforma”

Evitar (sin soporte legal/comercial explícito):

- “peg garantizado”
- “rendimiento/APY asegurado”
- “convertible a fiat en cualquier momento”
- “el usuario nunca ve cripto” (mejor: se abstrae complejidad, pero con disclosure claro de custodia/riesgos cuando aplique)

---

## 7) Cambios recomendados en la documentación existente

- `README.md`
  - actualizar supuestos de costos/finalidad con ACPs activados.
- `01-arquitectura.md`
  - aclarar diferencias Subnet/L1 post-Etna y criterios de migración.
- `02-smart-contracts.md`
  - incorporar patrón de escrow/vesting para release por venta concretada.
- `04-backend-django.md`
  - añadir idempotencia, cola async, reconciliación y política de error webhook.
- `05-onramp-fiat.md`
  - formalizar manejo de duplicados/reintentos/refunds.
- `06-tokenomics.md`
  - agregar índice textil USD, fórmula de pricing y límites anti-volatilidad.

---

## 8) Roadmap propuesto

## Fase 1 (2-4 semanas): control de daño

- Implementar regla dura: **sin venta concretada no hay token**.
- Agregar idempotencia + estados de orden/pago + conciliación diaria.
- Separar explícitamente “créditos de producto” de cualquier narrativa especulativa.

## Fase 2 (4-8 semanas): pricing textil USD

- Definir canasta ITX_USD y pipeline de cálculo diario.
- Activar fórmula de conversión PLR con límites de variación.
- Stress tests de volatilidad + simulación de chargebacks.

## Fase 3 (8+ semanas): hardening

- Escrow/vesting on-chain para rewards.
- Circuit breakers automatizados.
- Gobernanza de parámetros con timelock/multisig.

---

## 9) Fuentes externas usadas para actualizar supuestos

- Avalanche ACP-125 (base fee 25 → 1 nAVAX):
  - https://build.avax.network/docs/acps/125-basefee-reduction
- Avalanche ACP-176 (dynamic gas limit / price discovery):
  - https://build.avax.network/docs/acps/176-dynamic-evm-gas-limit-and-price-discovery-updates
- Avalanche ACP-226 (dynamic minimum block times):
  - https://build.avax.network/docs/acps/226-dynamic-minimum-block-times
- Diferencia Subnet vs L1 validators (post-Etna):
  - https://build.avax.network/guides/subnet-vs-l1-validators
- USDC nativo vs USDC.e (Circle + off-ramp):
  - https://www.circle.com/blog/understanding-usdc-on-avalanche-vs-usdc-e
  - https://support.avax.network/en/articles/8857127-usdc-cctp-faq
- Buenas prácticas de feeds/oráculos y mitigación de riesgo:
  - https://docs.chain.link/data-feeds/selecting-data-feeds
- OpenZeppelin (roles y vesting wallet):
  - https://docs.openzeppelin.com/contracts/5.x/access-control
  - https://docs.openzeppelin.com/contracts/5.x/api/finance#VestingWallet
- Webhooks / idempotencia / disputas (operación de pagos):
  - https://stripe.com/docs/webhooks/signature-verification
  - https://stripe.com/docs/api/idempotent_requests
  - https://stripe.com/docs/api/refunds
  - https://stripe.com/docs/disputes
- Marco PSAV/CNV (Argentina):
  - https://www.boletinoficial.gob.ar/detalleAviso/primera/305110/20240325
  - https://www.argentina.gob.ar/cnv/registro-de-proveedores-de-servicios-de-activos-virtuales
- Señales de evaluación (ecosistema hackathon/incubación):
  - https://codebase.avax.network
  - https://ethglobal.com/rules

---

## 10) Criterio final de negocio (expreso)

Para dejarlo inequívoco en todas las specs técnicas:

> **Solo se otorgan/liberan tokens al usuario cuando la venta está correctamente concretada y liquidada.**
> **Si la venta no se concreta (o se revierte), no se otorgan tokens.**

---

## 11) Casos de prueba faltantes (inventario exhaustivo para MVP)

Esta sección traduce las deudas detectadas en una matriz de pruebas ejecutables.

## 11.1 P0 — Bloqueantes para demo sólida (hacer primero)

| ID | Caso pendiente | Tipo | Dónde testear | Solución más fácil/profesional (MVP) | Criterio de aceptación |
|---|---|---|---|---|---|
| T01 | No liberar reward si la venta no está finalizada | Unit | `backend/apps/credits/tests/test_settlement_policy.py` | Extraer regla a función pura `is_reward_releasable(order, payment, flags)` | Con cualquier estado distinto de final, retorna `False` y `reward=0` |
| T02 | Liberación de reward exactamente una vez | Integration | `backend/apps/credits/tests/test_rewards_release.py` | Tabla `processed_events` con `provider_event_id` único + transacción atómica | Doble webhook no duplica mint ni transacción de crédito |
| T03 | Webhook inválido no procesa | API integration | `backend/apps/credits/tests/test_webhooks.py` | Verificar firma HMAC antes de parsear payload | Firma inválida => 401/403, 0 escrituras |
| T04 | Webhook con error interno no responde 200 prematuro | API integration | `backend/apps/credits/tests/test_webhooks.py` | Persistir evento primero; procesar async; solo 2xx si persistió | Si falla DB/procesamiento, no hay “ack exitoso silencioso” |
| T05 | Spend con saldo insuficiente | API integration | `backend/apps/credits/tests/test_spend_endpoint.py` | Validación previa de saldo cacheado + guard de negocio | Devuelve 402 y no llama blockchain client |
| T06 | Spend exitoso actualiza estado + saldo + tx_hash | API integration | `backend/apps/credits/tests/test_spend_endpoint.py` | Mock de cliente on-chain y assert de side effects | `CONFIRMED`, `tx_hash` presente, `cached_balance` decrementado |
| T07 | Falla on-chain no descuenta saldo y deja traza FAILED | API integration | `backend/apps/credits/tests/test_spend_endpoint.py` | Manejo explícito de excepción + rollback lógico | `FAILED`, saldo intacto, error controlado al frontend |
| T08 | `burnFrom` semántica coherente (custodial vs allowance) | Contract unit | `plr-contracts/test/PLRToken.test.ts` | Elegir un solo modelo y documentarlo: **MVP recomendado: custodial con BURNER_ROLE** | Test refleja exactamente la semántica elegida |
| T09 | `referenceId`/requestId anti-duplicado en mint/burn | Contract unit | `plr-contracts/test/PLRToken.test.ts` | `mapping(bytes32=>bool)` y revert si se repite | Segundo intento con mismo `referenceId` revierte |
| T10 | `pause()` bloquea mint/burn en emergencia | Contract unit | `plr-contracts/test/PLRToken.test.ts` | Mantener `ERC20Pausable` + tests de autorización | Con pause activo, mint/burn revierte |
| T11 | Límite `MAX_MINT_PER_TX` se cumple | Contract unit | `plr-contracts/test/PLRToken.test.ts` | Validar límite por transacción | Mint arriba del límite revierte |
| T12 | Snapshot de pricing determina reward reproducible | Unit | `backend/apps/credits/tests/test_pricing_policy.py` | `price_snapshot_id` inmutable por orden | Reprocesar la orden produce mismo reward |
| T13 | Clamp de variación diaria (ej. ±5%) | Unit | `backend/apps/credits/tests/test_pricing_policy.py` | Función pura `apply_price_clamp(prev, theoretical)` | Nunca supera límites diarios |
| T14 | Clawback por chargeback/refund tardío | Integration | `backend/apps/credits/tests/test_clawback.py` | Política simple: burn si hay saldo; si no, saldo negativo/hold futuro | Reversa posterior reduce exposición económica |

## 11.2 P1 — Importantes (después de P0)

| ID | Caso pendiente | Tipo | Dónde testear | Solución MVP | Criterio |
|---|---|---|---|---|---|
| T15 | Reconciliación PSP ↔ DB ↔ on-chain detecta drift | Integration | `backend/apps/credits/tests/test_reconciliation.py` | Job diario con reporte de desvíos | Drift > umbral genera alerta/reporte |
| T16 | Detección de evento fuera de orden (late webhook) | Integration | `backend/apps/credits/tests/test_webhooks.py` | Máquina de estados + transición válida | Evento inválido no corrompe estado |
| T17 | Ventana de devolución/chargeback cerrada antes de release | Unit | `backend/apps/credits/tests/test_settlement_policy.py` | Check explícito `return_window_closed && chargeback_window_closed` | Reward solo en “económicamente final” |
| T18 | Log/auditoría mínima de privilegios (mint/burn/pause) | Unit+integration | `backend/apps/credits/tests/test_audit_log.py` | Eventos + registro interno por actor/acción | Cada acción crítica queda trazada |

## 11.3 P2 — Nice to have (si hay tiempo)

| ID | Caso | Tipo | Valor para hackathon |
|---|---|---|---|
| T19 | Stress test de volatilidad ITX_USD + cargas de refunds | Simulation | Demuestra robustez económica |
| T20 | Smoke test E2E automático en Fuji (mint+burn+explorer links) | E2E | Evidencia fuerte para jueces |
| T21 | Test UI de flujo “comprar/gastar créditos” con mocks | Frontend integration | Mejora consistencia demo |

---

## 12) Cómo resolverlos rápido y profesional (camino MVP)

## 12.1 Principio clave para velocidad

Mover reglas de negocio críticas a funciones puras testeables:

- `settlement_policy.py` → reglas de liberación
- `pricing_policy.py` → snapshot + clamp
- `idempotency.py` → dedupe de eventos

Esto reduce dependencia de red/chain y permite tests rápidos en `pytest`.

## 12.2 Estructura sugerida (backend)

```text
backend/apps/credits/
  domain/
    settlement_policy.py
    pricing_policy.py
    idempotency.py
  services.py
  api/
    endpoints.py
    webhooks.py
  tests/
    test_settlement_policy.py
    test_pricing_policy.py
    test_webhooks.py
    test_spend_endpoint.py
    test_clawback.py
    test_reconciliation.py
```

## 12.3 Estructura sugerida (contratos)

```text
plr-contracts/
  contracts/PLRToken.sol
  test/PLRToken.test.ts
```

Solo un contrato para MVP demo (PLRToken) reduce riesgo de entrega.

## 12.4 Estructura sugerida (frontend)

```text
frontend/src/features/credits/
  components/SpendCreditsButton.tsx
  tests/SpendCreditsButton.test.tsx
```

Un botón funcional + feedback de `tx_hash` alcanza para demo fuerte.

---

## 13) Orden de implementación recomendado (para dormir tranquilo)

## Sprint Noche 1 (impacto máximo)

1. **T01/T02/T03/T06/T07** (backend)
2. **T08/T09/T10** (contrato PLRToken + tests)
3. **README con evidencia real**: address + 2-3 tx hashes Fuji

## Sprint Noche 2

4. **T12/T13/T14** (pricing + clawback)
5. **T15/T17** (reconciliación y cierre de ventanas)
6. Frontend test básico + polish demo

---

## 14) Estrategia para ganar el track Avalanche (práctica)

Priorizar lo que más puntúa en demos técnicas:

1. **Prueba on-chain verificable**
   - contrato verificado en Snowtrace,
   - tx hashes reales de mint/burn,
   - evidencia de eventos `CreditsIssued/CreditsBurned`.

2. **Historia de producto clara (web2 UX, web3 backend)**
   - usuario ve “créditos”,
   - blockchain invisible,
   - backend absorbe gas en Fuji.

3. **Controles profesionales mínimos**
   - idempotencia webhook,
   - release solo con venta final,
   - clawback en reversas,
   - pausa de emergencia.

4. **Demo script de 3 minutos (sin riesgo)**
   - Paso A: compra/simulación -> mint,
   - Paso B: gasto IA -> burn,
   - Paso C: mostrar explorer,
   - Paso D: mostrar test suite P0 en verde.

---

## 15) Definición de “listo para presentar” (DoD del MVP Avalanche)

Checklist mínimo:

- [ ] Contrato `PLRToken` desplegado y verificado en Fuji
- [ ] Endpoint backend `spend` funcionando con tx real
- [ ] Webhook protegido por firma + dedupe
- [ ] Regla “no sale -> no token” cubierta por tests
- [ ] Clawback básico implementado y testeado
- [ ] 10+ tests P0/P1 pasando (`pytest` + `hardhat test`)
- [ ] README actualizado con links reales a Snowtrace

Si se cumple esto, el proyecto queda competitivo para track Avalanche con una narrativa fuerte: **caso real LATAM + ejecución on-chain demostrable + controles de riesgo serios**.

---

## 16) Integración concreta en este repo (camino más fácil)

Estado observado del monorepo:

- Backend: `pytest` + `pytest-django` configurado en `backend/pyproject.toml`.
- Frontend: `vitest` configurado en `frontend/vitest.config.ts`.
- Contratos: no existe carpeta hardhat aún en repo (hay docs, no código ejecutable).

### 16.1 Dónde agregar cada prueba

#### Backend (rápido, alto impacto)

Crear carpeta:

```text
backend/apps/credits/tests/
```

Archivos mínimos:

- `test_settlement_policy.py` → T01, T17
- `test_webhooks.py` → T02, T03, T04, T16
- `test_spend_endpoint.py` → T05, T06, T07
- `test_pricing_policy.py` → T12, T13
- `test_clawback.py` → T14
- `test_reconciliation.py` → T15

#### Contratos (hardhat)

Crear workspace:

```text
plr-contracts/
  contracts/PLRToken.sol
  test/PLRToken.test.ts
```

Ahí cubrir T08, T09, T10, T11.

#### Frontend

Agregar:

```text
frontend/src/features/credits/tests/SpendCreditsButton.test.tsx
```

Cobertura mínima de UX: loading, success, error.

### 16.2 Comandos de ejecución recomendados

Backend:

```bash
cd backend
uv run pytest
```

Frontend:

```bash
cd frontend
pnpm test
```

Contratos (nuevo workspace):

```bash
cd plr-contracts
npx hardhat test
```

### 16.3 Regla operativa para mañana (sin sorpresas)

1. No introducir 3 contratos para MVP; empezar por **solo `PLRToken`**.
2. No meter Account Abstraction completa para demo inicial; usar backend signer en Fuji.
3. No abrir scope regulatorio en pitch; enfocar en “créditos de uso + controles”.
4. Mostrar evidencia real: explorer + tx hashes + tests P0 en verde.

---

## 17) Estándar mínimo de webhooks e idempotencia (basado en fuentes oficiales)

Para evitar doble mint y errores silenciosos:

1. **Validar firma del webhook sobre body crudo** (antes de parsear JSON).
2. **Deduplicar por `provider_event_id` único** en DB.
3. **Persistir evento recibido** antes de procesar lógica de negocio.
4. **Procesar idempotente**: mismo evento no cambia estado más de una vez.
5. **Outbox/retry** para efectos secundarios (notificaciones, métricas, etc.).
6. **State machine explícita** para refund/disputa/chargeback.
7. **Semántica correcta de respuesta HTTP**: no devolver 2xx si no pudiste persistir/procesar el evento (permitir retry del proveedor).
8. **Idempotency keys outbound**: para llamadas del backend al PSP (refund/capture), usar idempotency key por operación de negocio.

### Tests mínimos asociados

- Firma inválida => rechaza y no escribe.
- Evento duplicado => 200 idempotente, sin doble impacto.
- Falla en procesamiento => queda trazado para reintento, sin corrupción de saldo.
- Refund/chargeback => transición de estado correcta + clawback.

---

## 19) Criterios de evaluación hackathon (enfoque práctico y verificable)

Basado en señales de plataformas y programas de Avalanche/EVM:

1. **Demo funcional por encima de arquitectura aspiracional**
   - Artefacto: URL demo + flujo completo sin pasos manuales ocultos.

2. **Evidencia on-chain explícita**
   - Artefacto: contrato verificado + tx hashes recientes + eventos visibles en explorer.

3. **Iteración real durante el hackathon**
   - Artefacto: historial Git con commits incrementales (evitar “single huge commit” final).

4. **Caso de uso claro + por qué Avalanche**
   - Artefacto: narrativa de 1 minuto con problema real, solución y ventaja concreta en C-Chain (latencia/costo/tooling).

5. **Calidad de ejecución y riesgo controlado**
   - Artefacto: tests P0 en verde + manejo de fallos (idempotencia, reversas, pausa de emergencia).

### Señal estratégica para este proyecto

Para Plur, puntúa más mostrar una economía circular operativa (mint/burn spendable + controles anti-fraude) que intentar abarcar staking/marketplace/AA completos en la primera demo.

---

## 20) Runbook de integración para “overnight delivery”

### Objetivo de la noche

Entregar un MVP Avalanche demostrable en 1 flujo:

`compra/simulación -> mint -> gastar crédito IA -> burn -> evidencia en Snowtrace`

### Secuencia recomendada

1. Crear `plr-contracts` con **solo `PLRToken`** + tests T08-T11.
2. Deploy en Fuji + verify en Snowtrace.
3. Implementar backend `apps/credits` con endpoint `/api/credits/spend`.
4. Implementar webhook con firma + dedupe (T02-T04).
5. Añadir botón frontend para gastar créditos y mostrar `tx_hash`.
6. Ejecutar test suites mínimas y capturar evidencia para pitch.

### Evidencia que debe quedar lista

- Address de contrato verificado.
- 2-3 tx hashes (mint, burn, caso de error controlado).
- Captura de tests P0 pasando.
- README con links clickeables al explorer.

---

## 21) Recomendación final de enfoque técnico (opinión directa)

Si el objetivo es maximizar probabilidad de ganar el track Avalanche con tiempo limitado, la mejor decisión es:

### “Menos piezas, más evidencia”

- **1 contrato verificado** (`PLRToken`) en Fuji
- **1 endpoint crítico** (`/api/credits/spend`) con tx real
- **1 flujo UI simple** (gastar créditos)
- **tests P0** que prueban seguridad operativa (idempotencia + settlement + no double-mint)

Esto puntúa mejor que prometer una arquitectura grande sin pruebas ejecutables.
