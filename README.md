# Plur — Moda circular con IA y tokens

**Plur** es una plataforma de moda circular que combina un sistema de swipe estilo Tinder para descubrir prendas, un probador virtual con IA, y una economía de tokens ($PLR) sobre Avalanche para intercambiar ropa sin dinero.

> Hackathon Aleph — 2026

---

## ¿De qué va el proyecto?

La moda es una de las industrias más contaminantes del mundo. Plur resuelve el problema del sobre-consumo permitiendo que la ropa circule entre personas:

- **Swipeás** prendas de otros usuarios (like / pass, estilo Tinder)
- **Te probás** la ropa con IA antes de comprarla — subís tu foto y la IA genera una imagen realista de vos usando la prenda
- **Negociás** directamente con el vendedor desde el chat integrado
- **Ganás tokens PLR** cuando publicás tu propia ropa para vender
- **Usás tokens** para adquirir prendas sin gastar dinero real

El token $PLR es un ERC-20 sobre Avalanche C-Chain. El backend actúa como intermediario custodial (mint/burn) para que los usuarios no necesiten saber de crypto.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 18 + TypeScript + Vite 6 |
| **Estilos** | Tailwind CSS v4 + shadcn/ui |
| **Estado cliente** | Zustand + persist |
| **Estado servidor** | TanStack Query v5 |
| **Routing** | React Router v6 |
| **i18n** | react-i18next (ES / EN) |
| **Backend** | Django 5.2 + Django Ninja (API REST) |
| **Base de datos** | PostgreSQL (Docker local) |
| **Cache / Colas** | Redis (Docker local) |
| **Auth** | JWT — access token en memoria, refresh en httpOnly cookie |
| **Email** | Resend via django-anymail |
| **Smart contracts** | Solidity + Hardhat, ERC-20 sobre Avalanche C-Chain |
| **Infra local** | Docker Compose |
| **Package manager** | pnpm (frontend) · uv (backend) |

---

## Estructura del monorepo

```
plur/
├── backend/          # Django 5.2 + Django Ninja
│   ├── apps/         # Módulos: users, auth, garments, tokens...
│   ├── config/       # Settings (base / development / production)
│   ├── core/         # Utilidades compartidas
│   └── docker/       # Docker Compose (local, dev, prod)
├── frontend/         # React 18 + Vite
│   ├── src/
│   │   ├── features/ # Módulos por feature (dashboard, auth, landing...)
│   │   ├── stores/   # Zustand stores
│   │   ├── pages/    # Páginas (rutas)
│   │   └── locales/  # Traducciones ES / EN
│   └── public/
├── plr-contracts/    # Smart contracts ERC-20 (Hardhat)
│   └── contracts/    # PLRToken.sol
├── docs/             # Documentación técnica (Avalanche, Clover)
├── dev.sh            # Script para levantar todo el stack local
└── README.md
```

---

## Requisitos previos

Asegurate de tener instalado:

- [Docker](https://docs.docker.com/get-docker/) — para PostgreSQL y Redis
- [uv](https://docs.astral.sh/uv/) — gestor de paquetes Python
- [pnpm](https://pnpm.io/installation) — gestor de paquetes Node
- Node.js 20+
- Python 3.11+

---

## Levantar el proyecto localmente

### Opción 1 — Script todo-en-uno (recomendado)

```bash
# Cloná el repo
git clone https://github.com/facundopadilla/plur.git
cd plur

# (Opcional) Configurá las variables de entorno del backend
cp backend/.env.example backend/.env
# Editá backend/.env con tus valores locales

# Levantá todo el stack con un solo comando
bash dev.sh
```

El script `dev.sh`:
1. Libera los puertos 8000 y 5173 si estaban ocupados
2. Levanta PostgreSQL + Redis con Docker Compose
3. Espera a que Postgres esté listo
4. Aplica las migraciones de Django automáticamente
5. Inicia el servidor Django en `http://localhost:8000`
6. Inicia Vite en `http://localhost:5173`

Presioná `Ctrl+C` para detener todo limpiamente.

---

### Opción 2 — Manual (terminal por terminal)

**Terminal 1 — Infraestructura:**
```bash
cd backend
docker compose -f docker/local.yml up -d
```

**Terminal 2 — Backend:**
```bash
cd backend
uv sync                              # Instala dependencias Python
uv run python manage.py migrate      # Aplica migraciones
uv run python manage.py runserver    # Servidor en :8000
```

**Terminal 3 — Frontend:**
```bash
cd frontend
pnpm install                         # Instala dependencias JS
pnpm dev                             # Dev server en :5173
```

---

## Variables de entorno

### Backend (`backend/.env`)

```bash
# Copiá el ejemplo y completá los valores
cp backend/.env.example backend/.env
```

| Variable | Descripción |
|----------|-------------|
| `DJANGO_SECRET_KEY` | Secret key de Django |
| `DJANGO_DEBUG` | `True` en local, `False` en producción |
| `DATABASE_URL` | URL de PostgreSQL (e.g. `postgres://postgres:postgres@localhost:5432/plur`) |
| `REDIS_URL` | URL de Redis (e.g. `redis://localhost:6379/0`) |
| `CORS_ALLOWED_ORIGINS` | Origen del frontend en producción |
| `RESEND_API_KEY` | API key de Resend para envío de emails |

### Frontend (`frontend/.env.local`)

```bash
# Solo necesario si el backend no corre en localhost:8000
VITE_API_BASE_URL=/api
```

---

## Usuario de prueba

Para testing local, podés crear un usuario directamente:

```bash
cd backend
uv run python manage.py shell -c "
from apps.users.models import User
user, _ = User.objects.get_or_create(
    email='test@plur.lat',
    defaults={
        'first_name': 'Test',
        'last_name': 'User',
        'date_of_birth': '1990-01-01',
        'phone_number': '+5491112345678',
        'is_active': True,
    }
)
user.set_password('1234')
user.is_active = True
user.save()
print('Listo:', user.email)
"
```

**Credenciales:** `test@plur.lat` / `1234`

---

## Smart contracts (opcional)

```bash
cd plr-contracts
npm install
cp .env.example .env          # Completá DEPLOYER_PRIVATE_KEY
npm run compile               # Compila los contratos
npm run test                  # Ejecuta los tests
```

Para deploy en Avalanche Fuji (testnet):
```bash
npm run deploy:fuji
```

---

## API

La API REST está documentada automáticamente por Django Ninja:

- **Swagger UI:** `http://localhost:8000/api/docs`
- **OpenAPI JSON:** `http://localhost:8000/api/openapi.json`

Para regenerar los tipos TypeScript del frontend después de cambiar el backend:
```bash
cd frontend
pnpm generate:types
```

---

## Licencia

MIT — Hackathon Aleph 2026
