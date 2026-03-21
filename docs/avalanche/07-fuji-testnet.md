# 07 — Setup Dev: Hardhat + Fuji Testnet

## Datos de la red Fuji

| Parámetro | Valor |
|-----------|-------|
| Nombre | Avalanche Fuji C-Chain |
| Chain ID | `43113` |
| RPC URL | `https://api.avax-test.network/ext/bc/C/rpc` |
| RPC alternativo | `https://rpc.ankr.com/avalanche_fuji` |
| Explorer | `https://testnet.snowtrace.io` |
| Faucet | `https://core.app/tools/testnet-faucet` |
| Símbolo de gas | AVAX |
| Block time | ~1-2 segundos |

### Agregar Fuji a MetaMask (para testing manual)

1. Abrir MetaMask → Settings → Networks → Add Network
2. Network Name: `Avalanche Fuji`
3. RPC URL: `https://api.avax-test.network/ext/bc/C/rpc`
4. Chain ID: `43113`
5. Currency Symbol: `AVAX`
6. Block Explorer: `https://testnet.snowtrace.io`

---

## Paso 1: Crear wallets de desarrollo

```python
# tools/generate_wallets.py — ejecutar UNA VEZ y guardar los outputs en .env

from eth_account import Account
import secrets

# Wallet del deployer (para hacer deploy de contratos)
deployer = Account.from_key('0x' + secrets.token_hex(32))
print(f"DEPLOYER_ADDRESS={deployer.address}")
print(f"DEPLOYER_PRIVATE_KEY={deployer.key.hex()}")
print()

# Wallet del backend Django (para mint/burn)
backend = Account.from_key('0x' + secrets.token_hex(32))
print(f"BACKEND_WALLET_ADDRESS={backend.address}")
print(f"AVALANCHE_BACKEND_PRIVATE_KEY={backend.key.hex()}")
print()

# Wallet de tesorería (para rewards de staking)
treasury = Account.from_key('0x' + secrets.token_hex(32))
print(f"TREASURY_WALLET_ADDRESS={treasury.address}")
print(f"TREASURY_PRIVATE_KEY={treasury.key.hex()}")
```

```bash
python tools/generate_wallets.py
# Copiar outputs a backend/.env (NUNCA commitear)
```

---

## Paso 2: Obtener AVAX de testnet (faucet)

```
1. Ir a: https://core.app/tools/testnet-faucet
2. Conectar con MetaMask o pegar address del deployer
3. Seleccionar red: Fuji C-Chain
4. Solicitar AVAX de testnet (2 AVAX cada 24hs por address)
5. Verificar en: https://testnet.snowtrace.io/address/{DEPLOYER_ADDRESS}
```

**También necesita AVAX la wallet del backend Django** para pagar gas. Ir al faucet con `BACKEND_WALLET_ADDRESS`.

```python
# Verificar balance del faucet con Python
from web3 import Web3

w3 = Web3(Web3.HTTPProvider("https://api.avax-test.network/ext/bc/C/rpc"))
balance = w3.eth.get_balance("0xTU_ADDRESS")
print(f"Balance: {Web3.from_wei(balance, 'ether')} AVAX")
```

---

## Paso 3: Setup del proyecto Hardhat

```bash
# Crear directorio de contratos
mkdir plr-contracts && cd plr-contracts

# Inicializar con npm
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv
npm install @openzeppelin/contracts

# Inicializar Hardhat (elegir TypeScript + hardhat-toolbox)
npx hardhat init
```

### Estructura del proyecto

```
plr-contracts/
├── contracts/
│   ├── PLRToken.sol
│   ├── PLRStaking.sol
│   └── PLRMarketplace.sol
├── scripts/
│   └── deploy.ts
├── test/
│   ├── PLRToken.test.ts
│   └── PLRStaking.test.ts
├── .env              ← IGNORADO en .gitignore
├── hardhat.config.ts
└── package.json
```

### `.env` del proyecto Hardhat

```env
DEPLOYER_PRIVATE_KEY=0x...
BACKEND_WALLET_ADDRESS=0x...
TREASURY_WALLET_ADDRESS=0x...
SNOWTRACE_API_KEY=...  # Para verificar contratos (obtener en snowtrace.io)
```

---

## Paso 4: Copiar los contratos

Copiar `PLRToken.sol`, `PLRStaking.sol`, y `PLRMarketplace.sol` desde [02-smart-contracts.md](./02-smart-contracts.md) a la carpeta `contracts/`.

```bash
# Compilar para verificar que no hay errores
npx hardhat compile
# Output esperado: "Compiled X Solidity files successfully"
```

---

## Paso 5: Deploy en Fuji

```bash
# Copiar hardhat.config.ts desde 02-smart-contracts.md
# Copiar scripts/deploy.ts desde 02-smart-contracts.md

# Ejecutar deploy
npx hardhat run scripts/deploy.ts --network fuji
```

### Output esperado

```
Deploying with: 0xYOUR_DEPLOYER_ADDRESS
PLRToken deployed to: 0xAAAA...
PLRStaking deployed to: 0xBBBB...
PLRMarketplace deployed to: 0xCCCC...
Granted MINTER_ROLE to PLRStaking

✅ Deploy completo. Agregar al .env:
PLR_TOKEN_ADDRESS=0xAAAA...
PLR_STAKING_ADDRESS=0xBBBB...
PLR_MARKETPLACE_ADDRESS=0xCCCC...
```

### Si falla el deploy

```
Error: insufficient funds for gas * price + value
→ Solución: cargar AVAX al deployer desde el faucet

Error: nonce too low
→ Solución: esperar 10 segundos y reintentar

Error: network connection refused
→ Solución: verificar que la RPC URL es correcta, probar con ankr alternativo
```

---

## Paso 6: Verificar en Snowtrace

La verificación del contrato permite ver el código fuente en el explorer y facilita depuración:

```bash
# Requiere SNOWTRACE_API_KEY en .env
# Obtener en: https://snowtrace.io/myapikey

npx hardhat verify --network fuji \
  <PLR_TOKEN_ADDRESS> \
  <DEPLOYER_ADDRESS> \
  <BACKEND_WALLET_ADDRESS>

# Para PLRStaking:
npx hardhat verify --network fuji \
  <PLR_STAKING_ADDRESS> \
  <PLR_TOKEN_ADDRESS>
```

Una vez verificado, el contrato aparece con ✅ en:
```
https://testnet.snowtrace.io/address/<PLR_TOKEN_ADDRESS>#code
```

---

## Paso 7: Configurar el backend Django

```env
# backend/.env (agregar estas líneas)
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
AVALANCHE_BACKEND_PRIVATE_KEY=0x...   # La key de BACKEND_WALLET
PLR_TOKEN_ADDRESS=0xAAAA...
PLR_STAKING_ADDRESS=0xBBBB...
PLR_MARKETPLACE_ADDRESS=0xCCCC...
```

### Probar la conexión desde Django

```bash
cd backend
uv run python manage.py shell
```

```python
from apps.credits.blockchain import get_web3, get_plr_token_contract

w3 = get_web3()
print("Conectado:", w3.is_connected())
print("Block actual:", w3.eth.block_number)

contract = get_plr_token_contract(w3)
print("Total supply:", contract.functions.totalSupply().call())
```

---

## Paso 8: Test end-to-end completo

### A. Mint manual via Python

```python
# test_mint.py — ejecutar desde el directorio raíz
from apps.credits.services import CreditService

# Mintear 100 créditos a una wallet de prueba
tx_hash = CreditService.mint_credits(
    to_wallet="0xTU_WALLET_DE_PRUEBA",
    amount=100,
    reason="purchase",
    django_reference_id="test-001",
)
print(f"✅ TX Hash: {tx_hash}")
print(f"Ver en: https://testnet.snowtrace.io/tx/{tx_hash}")
```

### B. Verificar balance

```python
balance = CreditService.get_balance("0xTU_WALLET_DE_PRUEBA")
print(f"Balance: {balance} PLR")
# Debe mostrar: 100 PLR
```

### C. Burn de créditos

```python
tx_hash = CreditService.burn_credits(
    from_wallet="0xTU_WALLET_DE_PRUEBA",
    amount=5,
    reason="ai_generation",
    django_reference_id="test-002",
)
print(f"✅ Burn TX Hash: {tx_hash}")

balance = CreditService.get_balance("0xTU_WALLET_DE_PRUEBA")
print(f"Balance después del burn: {balance} PLR")
# Debe mostrar: 95 PLR
```

### D. Consultar en Snowtrace

```
https://testnet.snowtrace.io/address/<PLR_TOKEN_ADDRESS>
→ Pestaña "Token Holders": ver wallets con balance PLR
→ Pestaña "Transactions": historial de txs
→ Pestaña "Events": eventos CreditsIssued y CreditsBurned
```

---

## Paso 9: Integrar Privy en el frontend

```bash
cd frontend
npm install @privy-io/react-auth viem
```

```env
# frontend/.env.local
VITE_PRIVY_APP_ID=clxxxxxxxxx   # Obtener en dashboard.privy.io
```

### Verificar que Privy crea wallets en Fuji

```tsx
import { usePrivy, useWallets } from '@privy-io/react-auth'

export function WalletDebug() {
  const { user } = usePrivy()
  const { wallets } = useWallets()

  return (
    <div>
      <p>User ID: {user?.id}</p>
      <p>Wallet: {wallets[0]?.address}</p>
      <p>Chain ID: {wallets[0]?.chainId}</p>
      {/* Debería mostrar chainId: 43113 (Fuji) */}
    </div>
  )
}
```

---

## Checklist de setup completo

```
□ Wallets generadas y guardadas en .env (NUNCA commiteadas)
□ AVAX de testnet recibido en deployer + backend wallet (faucet)
□ Hardhat configurado para Fuji (hardhat.config.ts)
□ Contratos compilados sin errores (npx hardhat compile)
□ Contratos desplegados en Fuji (npx hardhat run scripts/deploy.ts --network fuji)
□ Contratos verificados en Snowtrace (npx hardhat verify...)
□ Addresses agregados al backend .env
□ Django conectado a Fuji (web3.is_connected() = True)
□ Test mint exitoso (tx visible en snowtrace)
□ Test burn exitoso (balance reducido)
□ Privy configurado en frontend (VITE_PRIVY_APP_ID)
□ Wallet se crea al loguearse con email
□ Balance se muestra como "créditos" en la app
```

---

## Costos estimados en Fuji (testnet = gratis)

| Operación | Gas estimado | AVAX (aprox) |
|-----------|-------------|-------------|
| Deploy PLRToken | ~1.500.000 gas | ~0.05 AVAX |
| Deploy PLRStaking | ~1.200.000 gas | ~0.04 AVAX |
| Mint 100 PLR | ~80.000 gas | ~0.002 AVAX |
| Burn 5 PLR | ~60.000 gas | ~0.0015 AVAX |
| Stake PLR | ~120.000 gas | ~0.003 AVAX |
| Transfer PLR | ~50.000 gas | ~0.001 AVAX |

En testnet, el AVAX es gratis (faucet). En mainnet, con AVAX a ~$25 USD:
- Mint: ~$0.05 USD (costo absorbido por Plur)
- Burn: ~$0.04 USD
- Transfer: ~$0.025 USD

**Todos los costos de gas los paga el backend de Plur — el usuario nunca ve ni paga gas.**
