# 01 — Arquitectura: C-Chain, Token y Contratos

## Elección de red: C-Chain vs Custom L1

### Opción A — Avalanche C-Chain (recomendada para Plur MVP)

La C-Chain es la "Ethereum de Avalanche": completamente EVM-compatible. Todo contrato que funciona en Ethereum funciona en C-Chain sin cambios.

**Ventajas:**
- EVM 100% compatible: Solidity, Hardhat, ethers.js, web3.py, MetaMask, todo funciona
- Validators ya existentes — no necesitamos montar infraestructura propia
- Finality probabilística en ~1 segundo
- Fees muy bajos (~0.001 AVAX ≈ ARS 1-2 por tx)
- Fuji testnet disponible con faucet gratuito
- Account Abstraction (EIP-4337) disponible vía ZeroDev y Biconomy
- Explorers: Snowtrace (https://testnet.snowtrace.io)

**Desventajas:**
- Gas se paga en AVAX (necesitamos Paymaster para ocultárselo al usuario)
- No podemos usar PLR como token de gas nativo

### Opción B — Custom Subnet / Avalanche L1

Crear nuestra propia blockchain dentro de Avalanche, con PLR como token de gas.

**Ventajas:**
- PLR como gas token nativo
- Control total sobre parámetros de red
- Posibilidad de reglas custom (KYC a nivel red, etc.)

**Desventajas:**
- Requiere montar validators propios (costo mensual significativo)
- Complejidad operativa alta
- No recomendado para un hackathon o MVP

### ✅ Decisión: C-Chain + Paymaster

Para Plur MVP usamos C-Chain con Account Abstraction para que el usuario no necesite AVAX. Plur patrocina las transacciones via un Paymaster (ver [03-abstraccion-usuario.md](./03-abstraccion-usuario.md)).

---

## Diseño del token PLR

### Parámetros básicos

| Parámetro | Valor |
|-----------|-------|
| Nombre | Plur |
| Símbolo | PLR |
| Decimals | 18 (estándar ERC-20) |
| Red | Avalanche C-Chain |
| Estándar | ERC-20 (OpenZeppelin 5.x) |
| Supply inicial | 0 (mintable on-demand) |
| Supply máximo | Sin límite hard-cap (controlado por lógica de negocio) |
| Mintable | Sí — solo por el backend (rol MINTER_ROLE) |
| Burnable | Sí — solo por el backend (rol BURNER_ROLE) |
| Pausable | Sí — en caso de emergencia |
| Stakeable | Via contrato separado PLRStaking |

### ¿Por qué supply 0 e ilimitado?

Los créditos son equivalentes a "saldo de plataforma" — se emiten cuando se compran/ganan y se queman cuando se gastan. No tiene sentido un supply fijo porque no es un token especulativo sino utilitario. Esto es análogo a cómo funcionan los puntos de Mercado Libre o los V-Bucks de Fortnite.

Si en el futuro se quiere hacer el token más escaso/especulativo, se puede agregar un hard cap o un mecanismo de quema deflatoria.

---

## Arquitectura de contratos

```
┌─────────────────────────────────────────────────────────────┐
│                      AVALANCHE C-CHAIN                       │
│                                                             │
│  ┌─────────────────┐         ┌───────────────────────────┐  │
│  │   PLRToken.sol  │◄────────│     PLRStaking.sol        │  │
│  │   (ERC-20)      │ approve │                           │  │
│  │                 │         │  stake(amount, duration)  │  │
│  │  mint()         │         │  unstake()                │  │
│  │  burn()         │         │  claimRewards()           │  │
│  │  transfer()     │         │  getRewards(address)      │  │
│  └────────┬────────┘         └───────────────────────────┘  │
│           │                                                  │
│           │ transfer()                                       │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │PLRMarketplace   │  ← Opcional para V2                    │
│  │   .sol          │                                        │
│  │                 │                                        │
│  │ createListing() │                                        │
│  │ buyListing()    │                                        │
│  │ cancelListing() │                                        │
│  └─────────────────┘                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
        ▲                   ▲
        │ web3.py (mint/burn)│ Privy SDK (transfer P2P)
        │                    │
┌───────────────┐   ┌────────────────────────────┐
│  Django       │   │  Frontend React             │
│  Backend      │   │                             │
│               │   │  Privy embedded wallet      │
│  - Mint on    │   │  (usuario no lo ve)         │
│    purchase   │   │                             │
│  - Burn on    │   │  "50 créditos"              │
│    AI gen     │   │  = 50 PLR en wallet         │
└───────────────┘   └────────────────────────────┘
```

---

## Roles y permisos (AccessControl)

Los contratos usan `AccessControl` de OpenZeppelin para roles granulares:

| Rol | bytes32 | Quién lo tiene | Puede hacer |
|-----|---------|---------------|-------------|
| `DEFAULT_ADMIN_ROLE` | `0x00` | Deployer (multisig en prod) | Todo |
| `MINTER_ROLE` | `keccak256("MINTER_ROLE")` | Wallet del backend Django | `mint()` |
| `BURNER_ROLE` | `keccak256("BURNER_ROLE")` | Wallet del backend Django | `burn()` |
| `PAUSER_ROLE` | `keccak256("PAUSER_ROLE")` | Deployer | `pause()` / `unpause()` |

**Seguridad clave:** la wallet del backend solo tiene `MINTER_ROLE` y `BURNER_ROLE`. Incluso si se compromete, no puede transferir tokens de otros usuarios ni cambiar roles.

---

## Wallet del backend (hot wallet)

El backend Django necesita una wallet para firmar transacciones de mint/burn:

```
Backend Wallet
├── Address: 0xABCD... (generada al deploy, guardada en .env)
├── Private key: en variable de entorno DJANGO_WALLET_PRIVATE_KEY (nunca en código)
├── Roles: MINTER_ROLE + BURNER_ROLE en PLRToken
└── Balance AVAX: necesita AVAX para pagar gas
    (en dev: recargado desde faucet Fuji; en prod: recargado periódicamente)
```

**Alternativa para producción:** usar un Paymaster en lugar de la wallet de backend para cubrir el gas, o integrar Gelato Relay para transacciones sin gas desde el servidor.

---

## Flujo de datos completo: "Usuario compra 100 créditos"

```
1. Usuario → Frontend: "Quiero 100 créditos"
2. Frontend → Backend: POST /api/credits/purchase { amount: 100, payment_method: "card" }
3. Backend → Transak/Clover: Cobra ARS 500 con tarjeta
4. Transak → Avalanche: Convierte ARS → PLR (o ARS → AVAX → PLR vía DEX)
   — O —
   Backend → PLRToken.mint(userWalletAddress, 100 * 10^18)
   (si el pago fue en FIAT y Plur maneja la equivalencia off-chain)
5. Backend → BD: Registra la compra
6. Frontend: Muestra "¡Compraste 100 créditos!"
```

**Nota sobre el flow de mint:** para el MVP, el backend puede simplemente mintear PLR directamente al recibir confirmación del pago FIAT. No hace falta pasar por un DEX. La equivalencia ARS/PLR la maneja el backend (igual que cualquier plataforma de créditos).

---

## Comparación: on-chain vs off-chain para "créditos"

### Opción A — Puramente off-chain (base de datos)
- Los "créditos" son solo un número en la DB de Django
- Sin blockchain real
- Rápido de implementar, sin complejidad cripto
- **Problema:** No permite P2P real, ni interoperabilidad futura, ni "circulación" de valor

### Opción B — Híbrido (recomendado)
- Créditos son PLR en blockchain
- Backend actúa como "bridge" entre pagos FIAT y blockchain
- La DB guarda estado para respuestas rápidas (cache del balance on-chain)
- **Ventaja:** Circular economy real — los créditos tienen valor transferible fuera de Plur si se quiere

### Opción C — Fully on-chain
- Todo pasa en contratos (incluyendo listings de ropa, matchmaking, etc.)
- Gas fees en cada operación
- Complejidad alta, experiencia de usuario complicada
- **No recomendado** para MVP

**✅ Elección: Opción B (Híbrido)**
