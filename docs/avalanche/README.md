# Avalanche × Plur — Índice de Documentación

## ¿Por qué Avalanche?

| Criterio | Ethereum | Polygon | Avalanche C-Chain |
|----------|----------|---------|-------------------|
| Finality | ~12 min | ~2 min | **~1-2 seg** |
| Costo tx (promedio) | $1-$50 | $0.01-$0.1 | **$0.01-$0.05** |
| EVM compatible | ✅ | ✅ | ✅ |
| Staking nativo | Solo ETH | No | ✅ (también PLR) |
| Tesnet con faucet gratuito | Sepolia | Mumbai | **Fuji** ✅ |
| Soporte LATAM | Limitado | Medio | **Creciente** |
| Soporte Account Abstraction | ✅ | ✅ | ✅ (ZeroDev, Biconomy) |

Avalanche ofrece la mejor combinación de velocidad, costo bajo y tooling EVM para una app de moda circular donde las microtransacciones (generar imagen IA, comprar prenda, P2P) deben sentirse instantáneas.

---

## Decisiones clave

| Decisión | Elección | Por qué |
|----------|---------|---------|
| Red | **C-Chain Fuji** (dev) / C-Chain Main (prod) | EVM compatible, sin validators propios |
| Token estándar | **ERC-20** (OpenZeppelin) | Más soporte, menos riesgo |
| Wallet para usuarios | **Privy embedded wallets** | Usuarios se logean con email, sin seed phrases |
| Transacciones sin gas | **Account Abstraction (EIP-4337) + Paymaster** | Plur paga el gas, usuarios no ven AVAX |
| Backend blockchain | **web3.py** en Django | Minting/burning desde el backend |
| Onramp FIAT | **Transak** (principal) + MercadoPago flow (Argentina) | Transak soporta ARS y AVAX |
| Deploy tool | **Hardhat** | Ecosistema maduro, TypeScript nativo |

---

## Concepto central: "Créditos" ≠ "Cripto"

Los usuarios de Plur **nunca ven** la palabra "crypto", "wallet", "AVAX", ni "blockchain".

| Lo que el usuario ve | Lo que pasa por detrás |
|---------------------|------------------------|
| "Tenés 150 créditos" | Balance de 150 PLR en su embedded wallet |
| "Comprá 100 créditos — ARS 500" | Transak convierte ARS → PLR, mintea tokens |
| "Generá imagen IA (5 créditos)" | Backend quema 5 PLR del usuario |
| "Vendé tu remera por 80 créditos" | Smart contract transfiere 80 PLR al vendedor |
| "Enviá créditos a @usuario" | Transfer PLR P2P |
| "Stakear créditos" | Llamada a `PLRStaking.stake()` con rewards en PLR |

---

## Archivos

| # | Archivo | Contenido |
|---|---------|-----------|
| 01 | [01-arquitectura.md](./01-arquitectura.md) | C-Chain vs Subnet, diseño del token, contratos |
| 02 | [02-smart-contracts.md](./02-smart-contracts.md) | Código Solidity: PLRToken, PLRStaking, PLRMarketplace |
| 03 | [03-abstraccion-usuario.md](./03-abstraccion-usuario.md) | Privy + Account Abstraction + UX sin crypto visible |
| 04 | [04-backend-django.md](./04-backend-django.md) | web3.py, mint/burn desde Django, eventos |
| 05 | [05-onramp-fiat.md](./05-onramp-fiat.md) | FIAT → PLR: Transak, MercadoPago flow, Argentina |
| 06 | [06-tokenomics.md](./06-tokenomics.md) | Economía de créditos, ganancia/gasto, staking |
| 07 | [07-fuji-testnet.md](./07-fuji-testnet.md) | Setup dev: Hardhat, deploy en Fuji, verificar |

---

## Flujo de alto nivel

```
USUARIO
  │
  ├─ Compra créditos ─────────────────────────────────────► Transak (FIAT → AVAX → PLR)
  │                                                           │
  ├─ Suscripción mensual ──────────────────────────────────► Backend mintea PLR al usuario
  │
  ├─ Vende prenda ─────────────────────────────────────────► Backend mintea PLR al vendedor
  │
  ├─ Genera imagen IA ─────────────────────────────────────► Backend quema PLR del usuario
  │                                                           │
  ├─ Compra prenda ────────────────────────────────────────► PLRMarketplace transfiere PLR
  │
  └─ Stakea créditos ──────────────────────────────────────► PLRStaking.stake() → rewards
```

---

## Contrato desplegado (Fuji testnet)

> *Pendiente de deploy — ver 07-fuji-testnet.md para instrucciones.*

| Contrato | Address Fuji | Explorer |
|----------|-------------|---------|
| PLRToken | TBD | https://testnet.snowtrace.io |
| PLRStaking | TBD | https://testnet.snowtrace.io |
| PLRMarketplace | TBD | https://testnet.snowtrace.io |
