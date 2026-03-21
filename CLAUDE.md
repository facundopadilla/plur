# CLAUDE.md — Monorepo Root

## Project Overview

Fullstack monorepo: Django 5.2 + Django Ninja backend, Vite + React frontend.
Backend deployed on Render.com. Frontend deployed on Render.com (static site) or Vercel.

```
proyecto/
├── CLAUDE.md                  ← this file: monorepo-level context
├── backend/
│   └── CLAUDE.md              ← Django-specific rules (read when working in backend/)
└── frontend/
    └── CLAUDE.md              ← React-specific rules (read when working in frontend/)
```

> When working in `backend/`, also read `backend/CLAUDE.md`.
> When working in `frontend/`, also read `frontend/CLAUDE.md`.

---

## Monorepo Commands

```bash
# --- Backend ---
cd backend
uv sync                                        # Install Python deps
uv run python manage.py runserver              # Run Django dev server (port 8000)
uv run python manage.py makemigrations
uv run python manage.py migrate
docker compose -f docker/local.yml up -d       # Start PostgreSQL + Redis

# --- Frontend ---
cd frontend
pnpm install                                   # Install JS deps
pnpm dev                                       # Run Vite dev server (port 5173)
pnpm build                                     # Production build
pnpm test                                      # Run Vitest
pnpm lint                                      # ESLint

# --- Type sync (run after changing backend API) ---
cd frontend
pnpm generate:types                            # Pull OpenAPI schema from Django and regenerate TS types
```

---

## Running Both Locally

```bash
# Terminal 1 — backend infra
cd backend && docker compose -f docker/local.yml up -d

# Terminal 2 — Django
cd backend && uv run python manage.py runserver

# Terminal 3 — React
cd frontend && pnpm dev
```

Frontend proxies `/api/*` to `http://localhost:8000` via Vite config — no CORS issues in dev.

### CORS

- In production, the backend must allow the frontend origin via `django-cors-headers` (`CORS_ALLOWED_ORIGINS` env var)
- In development, the Vite proxy handles `/api` → Django, so CORS is not needed locally

---

## Shared Conventions

### Icons

- Frontend uses `lucide-react` for all icons — no emoji or Unicode symbols in JSX
- See `frontend/CLAUDE.md` for usage details

### API Contract

- The single source of truth for the API contract is Django Ninja's **auto-generated OpenAPI schema** at `/api/openapi.json`
- TypeScript types in the frontend are **generated from that schema** — never written by hand
- After any backend endpoint change: run `pnpm generate:types` in `frontend/`

### Auth flow

- Backend issues **JWT access + refresh tokens** via a `/api/auth/token` endpoint
- **Access token** stored in memory (Zustand) — never in localStorage
- **Refresh token** stored in httpOnly cookie set by the backend — survives page reloads
- All protected API calls include `Authorization: Bearer <access_token>` header
- On 401, frontend calls `/api/auth/refresh` (cookie sent automatically) to get a new access token

### Error format

Django Ninja returns validation errors in this shape — frontend must handle it consistently:

```json
{
  "detail": [
    { "loc": ["body", "email"], "msg": "field required", "type": "value_error.missing" }
  ]
}
```

### Environment variables naming

| Scope    | Prefix          | Example                        |
|----------|-----------------|--------------------------------|
| Backend  | `DJANGO_`       | `DJANGO_SECRET_KEY`            |
| Backend  | *(none)*        | `CORS_ALLOWED_ORIGINS`         |
| Frontend | `VITE_`         | `VITE_API_BASE_URL`            |

Never use `VITE_` variables for secrets — they are exposed in the browser bundle.

---

## Monorepo Structure (full)

```
proyecto/
├── CLAUDE.md
├── backend/
│   ├── CLAUDE.md
│   ├── config/
│   │   └── settings/
│   │       ├── base.py
│   │       ├── local.py          # git-ignored
│   │       ├── development.py
│   │       └── production.py
│   ├── apps/
│   ├── core/
│   ├── docker/
│   │   ├── local.yml
│   │   ├── development.yml
│   │   └── production.yml
│   ├── pyproject.toml
│   └── manage.py
└── frontend/
    ├── CLAUDE.md
    ├── src/
    │   ├── api/                  # Generated types + API client
    │   ├── components/           # Shared UI components
    │   ├── features/             # Feature modules (auth, users, etc.)
    │   ├── hooks/                # Shared custom hooks
    │   ├── lib/                  # Utilities, i18n setup, etc.
    │   ├── pages/                # Route-level components
    │   ├── stores/               # Zustand stores
    │   └── main.tsx
    ├── public/
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

---

## .gitignore (root level)

```
# Backend
backend/config/settings/local.py
backend/.env
backend/.env.local
backend/.env.production

# Frontend
frontend/.env.local
frontend/node_modules
frontend/dist

# General
.DS_Store
*.log
```
