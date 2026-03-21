# CLAUDE.md — Frontend

## Stack

| Layer            | Technology                        |
|------------------|-----------------------------------|
| Bundler          | Vite 6                            |
| Framework        | React 18                          |
| Language         | TypeScript (strict mode)          |
| State            | Zustand                           |
| Server state     | TanStack Query v5                 |
| Auth             | JWT via httpOnly cookies          |
| Styles           | Tailwind CSS v4 + shadcn/ui       |
| i18n             | react-i18next                     |
| HTTP client      | axios + @hey-api/client-axios     |
| Routing          | React Router v6                   |
| Testing          | Vitest + React Testing Library    |
| Linting          | ESLint + Prettier                 |
| Package manager  | pnpm                              |

---

## Common Commands

```bash
# Install dependencies
pnpm install

# Dev server (http://localhost:5173, proxies /api → Django :8000)
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview

# Tests
pnpm test
pnpm test:coverage

# Linting and formatting
pnpm lint
pnpm format

# Regenerate TypeScript types from Django Ninja OpenAPI schema
# IMPORTANT: run this every time a backend endpoint changes
# Reads config from openapi-ts.config.ts automatically
pnpm generate:types
```

---

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts            # Axios instance with interceptors + hey-api config
│   │   ├── errors.ts            # NinjaValidationError, NinjaError, isNinjaValidationError
│   │   └── generated/           # AUTO-GENERATED — never edit manually
│   │       ├── types.gen.ts     # TS types for all backend schemas
│   │       ├── sdk.gen.ts       # Typed SDK functions (e.g. healthCheck())
│   │       ├── client.gen.ts    # HTTP client config
│   │       └── index.ts         # Re-exports
│   ├── components/
│   ├── features/
│   │   └── <feature>/
│   │       ├── components/      # Feature-specific components
│   │       ├── hooks/           # Feature-specific hooks
│   │       ├── stores/          # Feature-specific Zustand slice (if needed)
│   │       └── index.ts         # Public API of the feature
│   ├── hooks/                   # Shared custom hooks
│   ├── lib/
│   │   ├── i18n.ts              # react-i18next setup
│   │   └── utils.ts             # cn() helper (clsx + tailwind-merge)
│   ├── locales/
│   │   ├── es/
│   │   │   └── translation.json
│   │   └── en/
│   │       └── translation.json
│   ├── pages/
│   │   └── <PageName>/
│   │       └── index.tsx        # export function Component() — React Router lazy convention
│   ├── router/
│   │   ├── index.tsx            # Route definitions
│   │   └── PrivateRoute.tsx     # Auth guard
│   ├── stores/
│   │   └── auth.store.ts        # Global auth state
│   ├── test/
│   │   └── setup.ts             # Vitest setup
│   ├── App.tsx
│   ├── index.css                # Tailwind v4 directives + CSS variables (shadcn theme)
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env.example                 # Committed — lists required VITE_ vars without values
├── .env.local                   # git-ignored — actual local values
├── openapi-ts.config.ts         # @hey-api/openapi-ts configuration
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── package.json
```

---

## TypeScript — CRITICAL

> **Strict TypeScript always. No `any`. No implicit types. Every function typed.**

```json
// tsconfig.app.json — always enabled
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Rules

```tsx
// ✅ Always type props explicitly
interface UserCardProps {
  user: User
  onDelete: (id: number) => void
}

// ✅ Use generated types from backend — never define them manually
import type { UserOut, UserIn } from '@/api/generated'

// ✅ Use generated SDK functions
import { usersRetrieve } from '@/api/generated'

// ✅ Type async functions explicitly
const fetchUser = async (id: number): Promise<UserOut> => { ... }

// ❌ Never
const data: any = await fetchUser(1)
const Component = ({ user }) => ...   // no prop types
```

---

## API Integration with Django Ninja

### Type generation (the most important rule)

Django Ninja auto-generates an OpenAPI schema at `/api/openapi.json`.
**All TypeScript types that match backend models must come from this schema.**

```bash
# Reads openapi-ts.config.ts automatically
pnpm generate:types
```

Config file (`openapi-ts.config.ts`):
```typescript
import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: 'http://localhost:8000/api/openapi.json',
  output: {
    path: './src/api/generated',
    format: 'prettier',
    lint: 'eslint',
  },
  plugins: [
    '@hey-api/client-axios',
    '@hey-api/typescript',
    '@hey-api/sdk',
  ],
})
```

Generates in `src/api/generated/`:
- `types.gen.ts` — TS types for all schemas
- `sdk.gen.ts` — Typed SDK functions (e.g. `healthCheck()`)
- `client.gen.ts` — HTTP client config
- `index.ts` — Re-exports

```typescript
// ✅ Use generated types and SDK
import type { UserOut } from '@/api/generated'
import { usersRetrieve } from '@/api/generated'

// ❌ Never write types that mirror the backend manually
interface User {
  id: number
  email: string  // might drift from backend
}
```

Run `pnpm generate:types` after:
- Adding or modifying any backend endpoint
- Changing any Ninja schema (input/output)
- Changing any model field that's exposed in an API

### Axios client (src/api/client.ts)

```typescript
import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  withCredentials: true,   // send httpOnly cookies
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT access token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401 with _retry guard (prevents infinite loop)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      await useAuthStore.getState().refresh()
      return apiClient.request(originalRequest)
    }
    return Promise.reject(error)
  }
)
```

### Error handling — match Django Ninja's error shape

```typescript
// src/api/errors.ts
export interface NinjaValidationError {
  detail: Array<{ loc: string[]; msg: string; type: string }>
}
export interface NinjaError {
  detail: string | NinjaValidationError['detail']
}
export const isNinjaValidationError = (error: unknown): error is NinjaValidationError =>
  Array.isArray((error as NinjaValidationError)?.detail)
```

---

## TanStack Query — Server State

Use TanStack Query for **all** server state. Never store server data in Zustand.

```typescript
// ✅ Server data → TanStack Query
const { data: users, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => usersRetrieve(),  // generated SDK function
})

// ✅ Client-only state → Zustand
// (UI flags, auth tokens, preferences)

// ❌ Never store API responses in Zustand
```

---

## Zustand — Client State

Use Zustand only for true client state: auth session, UI preferences, etc.

```typescript
// src/stores/auth.store.ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setTokens: (access) => set({ accessToken: access }),
      refresh: async () => {
        // call /api/auth/refresh, update accessToken
      },
      logout: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
)
```

---

## Authentication — JWT

```
Login flow:
  POST /api/auth/token → { access_token, refresh_token }
  → store access_token in Zustand (memory)
  → store refresh_token in httpOnly cookie (set by backend)

Every request:
  Authorization: Bearer <access_token>

On 401:
  POST /api/auth/refresh (sends cookie automatically)
  → get new access_token
  → retry original request (with _retry guard to prevent loops)

Logout:
  POST /api/auth/logout (clears cookie on server)
  → clear Zustand
```

### Protected routes

```tsx
// src/router/PrivateRoute.tsx
export const PrivateRoute = () => {
  const token = useAuthStore((s) => s.accessToken)
  return token ? <Outlet /> : <Navigate to="/login" replace />
}
```

---

## Internationalization — react-i18next

```typescript
// src/lib/i18n.ts
i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: 'es',           // default: Spanish (Argentina)
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})
```

### Rules

```tsx
// ✅ Always use t() — no hardcoded strings in components
const { t } = useTranslation()
return <h1>{t('users.title')}</h1>

// ❌ Never
return <h1>Usuarios</h1>

// ✅ Namespace translations by feature
// locales/es/translation.json
{
  "users": { "title": "Usuarios" },
  "auth": { "login": "Iniciar sesión", "logout": "Cerrar sesión" }
}
```

---

## Component Conventions

```
✅ Functional components only — no class components
✅ Props interface always named <ComponentName>Props
✅ Default export for pages (export function Component()), named export for components
✅ One component per file
✅ Co-locate tests: UserCard.tsx → UserCard.test.tsx
✅ Use React.memo() only when profiling shows a problem — don't premature-optimize
```

### Icons

- Use `lucide-react` for all icons — never use emoji or Unicode symbols
- Import only the icons you need: `import { Heart, Star } from 'lucide-react'`
- Size with Tailwind classes (`w-5 h-5`) or the `size` prop
- For filled icons (e.g. star ratings), combine `fill-<color>` and `text-<color>` classes

```tsx
// ✅
import { Heart, Star } from 'lucide-react'
<Heart className="w-5 h-5 text-pl-accent" />
<Star className="w-4 h-4 fill-pl-accent text-pl-accent" />

// ❌ Never
<span>💚</span>
<span>★</span>
```

---

## Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: true } },
  },
  test: { globals: true, environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] },
})
```

---

## Environment Variables

```bash
# .env.example — commit this file
VITE_API_BASE_URL=/api
VITE_APP_NAME=Plur
```

**Rules:**
- All frontend env vars must start with `VITE_` — Vite only exposes these
- Never put secrets in `VITE_` vars — they end up in the browser bundle
- Access via `import.meta.env.VITE_XXX` — never `process.env`

---

## Testing

```typescript
// Vitest + React Testing Library
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('UserCard', () => {
  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn()
    render(<UserCard user={mockUser} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith(1)
  })
})
```

**Rules:**
- Mock API calls with `msw` (Mock Service Worker) — never mock `axios` directly
- Test behavior, not implementation — avoid testing internal state
- Coverage target: **≥ 70%** on `src/features/` and `src/components/`

---

## CORS — Backend must allow frontend origin

In development, the Vite proxy handles `/api` → no CORS needed locally.
CORS config is only for production (see root `CLAUDE.md`).

---

## Tailwind CSS + shadcn/ui

### Setup

- **Tailwind v4** via `@tailwindcss/vite` plugin (no `tailwind.config.ts` — v4 auto-detects content)
- **shadcn/ui** configured in `components.json` (style: `base-nova`, baseColor: `neutral`)
- CSS entry point: `src/index.css` — contains `@import "tailwindcss"` + CSS variables for theming

### Adding shadcn components

```bash
# Add individual components from the registry
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add dialog
```

Components are generated into `src/components/ui/`. Never edit them manually — re-run `shadcn add` to update.

### cn() utility

```typescript
import { cn } from '@/lib/utils'

// Merge Tailwind classes safely, resolving conflicts
<div className={cn('px-4 py-2', isActive && 'bg-primary', className)} />
```

### Theming

Colors are CSS variables defined in `src/index.css` (`:root` and `.dark` blocks).
To customize the theme, edit the CSS variables directly — or regenerate a full theme from https://ui.shadcn.com/themes and paste it into `src/index.css`.

Key variables: `--primary`, `--secondary`, `--background`, `--foreground`, `--destructive`, `--muted`, `--border`, `--radius`.

### ESLint

`src/components/ui/**/*.tsx` is excluded from `react-refresh/only-export-components` — shadcn components intentionally export both components and variant helpers (e.g. `buttonVariants`).

---

## What NOT to do

- ❌ Never use `any` in TypeScript
- ❌ Never write types that duplicate backend models — use `pnpm generate:types`
- ❌ Never store server state in Zustand — use TanStack Query
- ❌ Never store the JWT access token in `localStorage` — use Zustand memory (+ httpOnly cookie for refresh)
- ❌ Never hardcode strings in components — use `t()` from react-i18next
- ❌ Never edit files in `src/api/generated/` — they are auto-generated
- ❌ Never use `process.env` — use `import.meta.env`
- ❌ Never use emoji or Unicode symbols as icons — use `lucide-react` components
