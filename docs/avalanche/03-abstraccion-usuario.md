# 03 — Abstracción de Usuario: Privy + Account Abstraction

## El problema: hacer cripto invisible

Los usuarios de Plur son personas que compran y venden ropa, **no son usuarios de cripto**. El objetivo es que:

- Nunca vean la palabra "wallet", "seed phrase", "gas", "AVAX", ni "blockchain"
- La experiencia sea idéntica a cualquier app con puntos o créditos
- No necesiten instalar MetaMask ni ninguna extensión
- No necesiten comprar AVAX para pagar gas
- Se logueen con email o Google, como en cualquier app

---

## Solución: Privy (embedded wallets)

**Privy** es la librería líder para crear wallets embebidas invisibles para el usuario. Cuando un usuario se registra en Plur, Privy automáticamente:

1. Crea una wallet Ethereum (C-Chain compatible) en el backend
2. La key privada se guarda **fragmentada** entre el dispositivo del usuario y los servidores de Privy (MPC — Multi-Party Computation)
3. El usuario nunca ve su private key
4. Para firmar transacciones, el usuario solo hace lo que ya hace (login con email/Google)

### Alternativas evaluadas

| Librería | Embedded Wallets | AA/Gasless | LATAM soporte | Precio |
|---------|-----------------|-----------|--------------|--------|
| **Privy** | ✅ Email, Google, SMS | ✅ | ✅ | Free tier disponible |
| Dynamic | ✅ Email, Social | ✅ | ✅ | Free tier disponible |
| Magic.link | ✅ Email, OAuth | ✅ | ✅ | $0.05/MAU |
| Particle Network | ✅ Social login | ✅ | Limitado | Free tier |
| Web3Auth | ✅ Social | Parcial | ✅ | Free tier |

**✅ Recomendación: Privy** — mejor DX, documentación más completa, adopción creciente en LATAM, soporte Avalanche confirmado.

---

## Flujo de usuario con Privy

```
Usuario visita plur.app
        ↓
"Creá tu cuenta con email"
        ↓
Privy crea embedded wallet silenciosamente
(0x1234...ABCD ← usuario NO ve esto)
        ↓
Backend asocia walletAddress al user.id en la DB
        ↓
Usuario ve: "Bienvenido, tenés 0 créditos"
(backend lee balance de PLR en la wallet)
        ↓
"Comprá créditos" → pago con tarjeta → backend mintea PLR
        ↓
Usuario ve: "Ahora tenés 100 créditos"
```

---

## Instalación en el frontend React

```bash
npm install @privy-io/react-auth
# También instalar viem para compatibilidad con Avalanche
npm install viem
```

### Configuración inicial

```tsx
// src/main.tsx
import { PrivyProvider } from '@privy-io/react-auth'
import { avalancheFuji } from 'viem/chains'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <PrivyProvider
    appId={import.meta.env.VITE_PRIVY_APP_ID}
    config={{
      loginMethods: ['email', 'google'],
      appearance: {
        theme: 'dark',
        accentColor: '#your-pl-accent',
        logo: '/logo.svg',
      },
      embeddedWallets: {
        createOnLogin: 'users-without-wallets', // crear wallet automáticamente
        requireUserPasswordOnCreate: false,      // sin contraseña extra
        noPromptOnSignature: true,               // NO pedir confirmación al usuario
      },
      supportedChains: [avalancheFuji],
      defaultChain: avalancheFuji,
    }}
  >
    <App />
  </PrivyProvider>
)
```

### Hook de uso en componentes

```tsx
// src/features/credits/hooks/useCredits.ts
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

export function useCredits() {
  const { user, authenticated } = usePrivy()
  const { wallets } = useWallets()

  // Los créditos se consultan al backend (que hace el read on-chain)
  // Nunca consultamos la blockchain directamente desde el frontend
  const { data: balance } = useQuery({
    queryKey: ['credits', user?.id],
    queryFn: () => apiClient.get('/api/credits/balance').then(r => r.data.balance),
    enabled: authenticated,
    refetchInterval: 30_000, // Actualizar cada 30 segundos
  })

  return {
    balance: balance ?? 0,
    walletAddress: wallets[0]?.address,
  }
}
```

```tsx
// src/features/credits/components/CreditsDisplay.tsx
import { useCredits } from '../hooks/useCredits'

export function CreditsDisplay() {
  const { balance } = useCredits()
  return (
    <div className="flex items-center gap-2">
      <span className="text-pl-accent font-semibold">{balance}</span>
      <span className="text-pl-gray-400 text-sm">créditos</span>
    </div>
  )
}
```

---

## Account Abstraction: transacciones sin gas

Incluso con Privy, las transacciones on-chain requieren pagar gas en AVAX. Para que el usuario **nunca necesite AVAX**, usamos **Account Abstraction (EIP-4337)** con un **Paymaster** que patrocina las transacciones.

### Flujo con Account Abstraction

```
Usuario → "Generar imagen IA (5 créditos)"
                ↓
Frontend → Backend: POST /api/credits/spend { amount: 5, reason: "ai_generation" }
                ↓
Backend construye UserOperation (EIP-4337)
                ↓
Bundler empaqueta la operación
                ↓
Paymaster valida y paga el gas en AVAX
                ↓
PLRToken.burn(userWallet, 5 PLR) se ejecuta
                ↓
Usuario ve: "Imagen generada (−5 créditos)"
```

### Opciones de Account Abstraction para Avalanche

| Proveedor | Avalanche C-Chain | Fuji Testnet | Modelo de pago Paymaster |
|-----------|------------------|-------------|-------------------------|
| **ZeroDev** | ✅ | ✅ | Gas subsidio / ERC-20 gas |
| **Biconomy** | ✅ | ✅ | Pago en ERC-20 o subsidio |
| **Alchemy Account Kit** | ✅ | ✅ | Gas Manager |
| **Pimlico** | ✅ | ✅ | Sponsoring + ERC-20 paymaster |

**✅ Recomendación: ZeroDev** — mejor integración con Privy, documentación clara para Avalanche.

### Setup de ZeroDev (alternativa simplificada)

Para el MVP, el enfoque más simple es que el backend use **Gelato Relay** o simplemente **llamadas firmadas desde el backend** (sin AA completo). Esto es suficiente para un hackathon.

**Opción MVP (más simple):**

```python
# El backend tiene su propia wallet con AVAX para gas.
# Cuando el usuario "gasta créditos", el backend firma y envía la tx.
# El usuario nunca necesita AVAX.

# Django view:
# 1. Usuario pide gastar créditos
# 2. Backend verifica saldo en DB
# 3. Backend firma tx de burn() con su propia wallet
# 4. Backend paga el gas
# 5. Actualiza DB
```

Esta es la arquitectura más simple y suficiente para un hackathon. La diferencia con AA completo es que en esta versión el backend es el que firma (no la wallet del usuario), pero el efecto es el mismo para el usuario.

---

## Variables de entorno necesarias

```env
# Frontend (Vite)
VITE_PRIVY_APP_ID=clxxxxxxxxxxxxxxxxx   # Obtenido en dashboard.privy.io

# Backend Django
DJANGO_AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
DJANGO_WALLET_PRIVATE_KEY=0x...  # Wallet del backend (con MINTER_ROLE + AVAX para gas)
DJANGO_PLR_TOKEN_ADDRESS=0x...
DJANGO_PLR_STAKING_ADDRESS=0x...
```

---

## Configuración de Privy Dashboard

1. Ir a https://dashboard.privy.io
2. Crear una app → obtener App ID
3. En **Appearance**: configurar logo, colores (sin mostrar nada de crypto)
4. En **Login methods**: habilitar Email + Google (deshabilitar wallet connect, metamask, etc.)
5. En **Embedded wallets**: "Create on login for all users", desactivar prompts de firma
6. En **Chains**: agregar Avalanche Fuji (Chain ID 43113)
7. En **Whitelist**: dominio `plur.app` (y `localhost:5173` para dev)

---

## UX final: lo que el usuario ve vs lo que pasa

| Acción del usuario | Lo que ve | Lo que pasa en background |
|-------------------|-----------|--------------------------|
| Registrarse con email | Formulario normal | Privy crea wallet 0x... MPC |
| Ver balance | "150 créditos" | GET /api/credits/balance → lee PLR on-chain |
| Generar imagen IA | "−5 créditos" | Backend quema 5 PLR con su wallet |
| Comprar créditos | "✓ Compra exitosa" | Transak procesa pago → backend mintea PLR |
| Vender prenda | "+80 créditos en 24hs" | Backend mintea PLR al vendedor post-confirmación |
| Stakear créditos | "Bloqueaste 50 créditos por 30 días. Ganarás ~0.5 créditos extra." | Backend llama PLRStaking.stake() |
| Enviar créditos a amigo | "Enviaste 20 créditos a @maria" | Backend llama PLRToken.transfer() |

**Principio:** el blockchain es un detalle de implementación, no una característica del producto.
