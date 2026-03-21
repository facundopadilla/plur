# 06 — Tokenomics: Economía de Créditos PLR

## Filosofía del sistema

Los créditos de Plur son **tokens de utilidad** dentro de un ecosistema de moda circular. No son moneda especulativa — son el lubricante de la economía de prendas usadas.

El objetivo es que los usuarios **circulen** créditos en lugar de acumularlos, para que las prendas también circulen. Por eso tiene sentido:
- Ganar créditos vendiendo ropa (incentiva publicar prendas)
- Gastar créditos en IA (incentiva encontrar combinaciones y comprar)
- Stakear créditos (recompensa la fidelidad y reduce la circulación inflacionaria)
- P2P de créditos (permite liquidez entre usuarios)

---

## Fuentes de emisión (MINT) — ¿Cuándo se crean créditos?

| Evento | Créditos emitidos | Límite | Notas |
|--------|-----------------|--------|-------|
| Compra de créditos (FIAT) | Según paquete (ver tabla) | Sin límite | Demanda del usuario |
| Suscripción mensual | 200 PLR/mes | Por suscripción activa | Se emiten al renovar |
| Venta de prenda | 10% del precio de venta | Por prenda vendida | Incentivo circular |
| Referido nuevo usuario | 50 PLR | Por referido | Programa de referidos |
| Completar perfil de onboarding | 10 PLR | Una vez | Bienvenida |
| Staking rewards | ~12% APY sobre stakeado | Por período stakeado | Recompensa fidelidad |

### Paquetes de compra FIAT

| Paquete | Créditos | Precio ARS | Precio por crédito |
|---------|---------|-----------|-------------------|
| Starter | 100 PLR | ARS 500 | ARS 5/crédito |
| Popular | 500 PLR | ARS 2.000 | ARS 4/crédito |
| Premium | 1.000 PLR | ARS 3.500 | ARS 3.5/crédito |
| Mega | 5.000 PLR | ARS 15.000 | ARS 3/crédito |

*Los precios se ajustan por inflación en settings del backend sin deploy de contratos.*

### Suscripciones mensuales

| Plan | Precio ARS/mes | Créditos incluidos | Extra |
|------|--------------|-------------------|-------|
| Basic | ARS 1.200 | 150 PLR | Acceso básico IA |
| Pro | ARS 2.500 | 400 PLR | IA ilimitada 3D |
| Business | ARS 6.000 | 1.200 PLR | API + acceso mayorista |

---

## Fuentes de quema (BURN) — ¿Cuándo se destruyen créditos?

| Evento | Créditos quemados | Notas |
|--------|-----------------|-------|
| Generar imagen IA (básica) | 5 PLR | Outfit matching, collage |
| Generar imagen IA (premium) | 15 PLR | 3D try-on, alta calidad |
| Comprar prenda en marketplace | Precio en PLR | Va al vendedor (menos fee) |
| Fee de plataforma en ventas | 2.5% del precio | Quemado (deflacionario) |
| Transferencia P2P (fee) | 1% del monto | Opcional, quemado |
| Boost de publicación | 10-50 PLR | Para destacar prenda |

---

## Modelo de staking

### Parámetros

```
APY base: 12% anual
Períodos disponibles: 7 días / 30 días / 90 días / 180 días
Penalidad retiro anticipado: 20% sobre principal
Mínimo de stake: 10 PLR
```

### Ejemplos de retorno

| Staking | Período | APY | Recompensa |
|---------|---------|-----|-----------|
| 100 PLR | 30 días | 12% | ~1 PLR |
| 500 PLR | 90 días | 12% | ~15 PLR |
| 1.000 PLR | 180 días | 12% | ~59 PLR |
| 5.000 PLR | 365 días | 12% | ~600 PLR |

### Presentación en la app (sin crypto)

```
┌──────────────────────────────────────────┐
│  🔒 Bloquear créditos                    │
│                                          │
│  Bloqueá tus créditos y ganá más.        │
│  Cuantos más días, más recompensa.        │
│                                          │
│  Cantidad: [___] créditos                │
│                                          │
│  Período:  ○ 7 días   ● 30 días         │
│            ○ 90 días  ○ 180 días         │
│                                          │
│  Estimado: +1.5 créditos extra           │
│                                          │
│  [  Bloquear créditos  ]                 │
└──────────────────────────────────────────┘
```

No menciona "APY", no menciona "staking", no menciona "blockchain".

---

## Mecánica de la economía circular

### Flujo de valor entre usuarios

```
Ana tiene ropa que no usa
        │
        │ Publica prenda por 200 créditos
        │ (o pide AI para saber cuánto vale)
        ▼
Plataforma Plur
        │
        │ María la encuentra con el AI match
        │ (gastó 5 créditos para buscar)
        │
        │ María compra la prenda
        │ 200 créditos van a Ana
        │ (menos 2.5% fee = 5 créditos quemados)
        │
        ▼
Ana tiene 195 créditos nuevos
        │
        │ Ana usa 15 créditos para generar
        │ outfit 3D con su ropa nueva
        │
        │ Le gusta y sigue comprando
        ▼
Circulación continua de prendas y créditos
```

### Balance emisión/quema esperado

En un usuario activo mensual:
- **Gana** ~100-200 PLR (venta de 1-2 prendas + suscripción)
- **Gasta** ~80-150 PLR (generar imágenes + comprar 1 prenda)
- **Stockea** ~20-50 PLR acumulados
- **Stakea** ~30-100 PLR de sus créditos acumulados

Esto genera una presión deflacionaria neta positiva: más créditos se queman que se crean vía actividad (sin contar compras directas).

---

## Pool de recompensas de staking

El contrato PLRStaking necesita PLR para pagar recompensas. Opciones:

### Opción A — Reserva del tesoro (recomendado MVP)

El equipo de Plur mantiene una wallet "tesoro" con PLR pre-minted. Periódicamente transfiere PLR al contrato de staking como rewards.

```python
# El backend calcula cuánto PLR se necesita para las recompensas del mes
# y transfiere desde la wallet de tesorería al contrato de staking
```

### Opción B — Minting en el contrato (más descentralizado)

Darle `MINTER_ROLE` al contrato de staking para que mintee las recompensas directamente. Más simple en código, pero aumenta el supply total.

### Opción C — Fees como recompensas (largo plazo)

Los fees de plataforma (2.5% en ventas) van al pool de staking en lugar de quemarse. Esto crea un ciclo sostenible sin inflación extra.

---

## Escenarios de uso y créditos necesarios

### Usuario casual (1-2 veces/semana)

```
Acciones mensuales:
  - Busca outfits IA: 4 × 5 PLR = 20 PLR gastados
  - Compra 1 prenda: ~100 PLR gastados
  - Vende 1 prenda: ~80 PLR ganados

Necesita comprar: ~40 PLR/mes (ARS 200 = Starter pack cada 2 meses)
```

### Usuario activo (diario)

```
Acciones mensuales:
  - Busca outfits IA: 30 × 5 PLR = 150 PLR gastados
  - Genera try-on 3D: 10 × 15 PLR = 150 PLR gastados
  - Compra 3 prendas: ~350 PLR gastados
  - Vende 5 prendas: ~500 PLR ganados

Necesita suscripción Pro: ARS 2.500/mes = 400 PLR + lo que gana vendiendo
```

### Vendedor/Revendedor

```
Acciones mensuales:
  - Publica 20 prendas: uso de IA para fotos = 100 PLR
  - Vende 15 prendas promedio 150 PLR c/u = 2.250 PLR ganados
  - Fee de plataforma: 56 PLR quemados

Genera ~2.150 PLR/mes — puede convertir a FIAT o seguir circulando
```

---

## Control de inflación

### Métricas a monitorear

- **Total supply** de PLR en circulación
- **Ratio mint/burn** semanal (objetivo: < 1.2 a largo plazo)
- **Créditos en staking** (reduce presión inflacionaria)
- **Precio implícito** ARS/PLR (se puede ajustar en settings)

### Ajustes posibles sin deploy de contratos

El backend Django controla:
- Precios de paquetes FIAT (variable en DB)
- Costo en PLR de features IA (variable en settings)
- % reward por ventas (variable en settings)
- APY del staking (llamada al contrato, solo el owner puede cambiar)

### Ajustes que sí requieren cambios en contrato

- Hard cap de supply máximo
- Nueva mecánica de quema (burn deflacionario)
- Cambio en reglas de staking complejas

---

## Anti-fraude y límites

### Límites en PLRToken.sol

```solidity
// Máximo 1 millón PLR por tx de mint (protección contra bugs)
uint256 public constant MAX_MINT_PER_TX = 1_000_000 * 10**18;
```

### Límites en el backend Django

```python
# Máximo PLR por usuario por día (para evitar abusos)
MAX_MINT_PER_USER_PER_DAY = 10_000  # 10.000 PLR/día

# Rate limiting en el endpoint de compra
# (via django-ratelimit o nginx)

# Idempotency keys en todas las transacciones
# (evita double-mint por retries)
```

### Detección de anomalías

- Alertas si un usuario recibe >500 PLR en < 1 hora (fuera de compra)
- Log de todas las transacciones con referenceId único
- Reconciliación diaria entre DB de Django y blockchain
