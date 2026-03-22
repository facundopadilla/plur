<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="frontend/public/plur-banner.svg">
  <source media="(prefers-color-scheme: light)" srcset="frontend/public/plur-banner.svg">
  <img alt="Plur — Circular Fashion Redefined" src="frontend/public/plur-banner.svg" width="600">
</picture>

<br />

[![Live App](https://img.shields.io/badge/Live_App-plur.wtf-C8FF00?style=for-the-badge&logo=vercel&logoColor=black)](https://plur.wtf)
[![Pitch Deck](https://img.shields.io/badge/Pitch_Deck-Slides-1A1A1A?style=for-the-badge&logo=slides&logoColor=white)](https://aleph-plur-diapositives.vercel.app/)
[![Hackathon](https://img.shields.io/badge/Aleph_Hackathon-2026-E84142?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0id2hpdGUiLz48L3N2Zz4=&logoColor=white)](https://www.aleph.crecimiento.build)

<br />

![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Django](https://img.shields.io/badge/Django_5.2-092E20?style=flat-square&logo=django&logoColor=white)
![Django Ninja](https://img.shields.io/badge/Django_Ninja-009688?style=flat-square&logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Avalanche](https://img.shields.io/badge/Avalanche_C--Chain-E84142?style=flat-square&logo=avalanche&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=flat-square&logo=google&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=black)

<br />

**Swipe. Try on. Exchange.**

La moda circular reinventada. Descubri prendas, probalas con IA y usa tokens para intercambiar ropa con otros. Sin desperdicio, puro estilo.

</div>

---

## Que es Plur?

La moda es una de las industrias mas contaminantes del mundo. **Plur** resuelve el problema del sobre-consumo permitiendo que la ropa circule entre personas:

- **Swipea** prendas de otros usuarios (like / pass, estilo Tinder)
- **Probate** la ropa con IA antes de comprarla — subis tu foto y Gemini genera una imagen realista de vos usando la prenda
- **Publica** tus prendas con autocompletado inteligente — subis una foto y la IA detecta nombre, talle, estilo y condicion
- **Chatea** directamente con el vendedor desde el chat integrado en tiempo real
- **Compra creditos PLR** con tarjeta (ARS, USD, EUR, BRL, CLP, MXN) — calculadora bidireccional con minteo on-chain
- **Gana tokens PLR** cuando publicas tu propia ropa para vender

El token **$PLR** es un ERC-20 sobre **Avalanche C-Chain**. El backend actua como intermediario custodial (mint/burn) para que los usuarios no necesiten saber de crypto.

---

## Links del proyecto

| | Link |
|---|---|
| **App en vivo** | [plur.wtf](https://plur.wtf) |
| **API Backend** | [api.plur.wtf](https://api.plur.wtf/api/health) |
| **Pitch Deck** | [aleph-plur-diapositives.vercel.app](https://aleph-plur-diapositives.vercel.app/) |
| **API Docs (Swagger)** | [api.plur.wtf/api/docs](https://api.plur.wtf/api/docs) |

---

## Stack tecnologico

### Frontend

| Tecnologia | Uso |
|---|---|
| **React 18** + TypeScript | UI framework |
| **Vite 6** | Bundler + dev server |
| **Tailwind CSS v4** + shadcn/ui | Estilos + componentes |
| **Zustand** + persist | Estado cliente |
| **TanStack Query v5** | Estado servidor (cache, mutations) |
| **React Router v6** | Routing SPA |
| **react-i18next** | Internacionalizacion (ES / EN) |
| **Lucide React** | Iconografia |

### Backend

| Tecnologia | Uso |
|---|---|
| **Django 5.2** | Framework web (async) |
| **Django Ninja** | API REST con OpenAPI auto-generado |
| **PostgreSQL 18** | Base de datos principal |
| **Redis** | Cache y colas |
| **JWT** | Auth — access token en memoria, refresh en httpOnly cookie |
| **Resend** + django-anymail | Emails transaccionales |
| **Loguru** | Logging estructurado |

### AI & Blockchain

| Tecnologia | Uso |
|---|---|
| **Google Gemini** | Probador virtual IA (try-on) + analisis de prendas |
| **Cloudinary** | CDN de imagenes generadas |
| **Avalanche C-Chain** (Fuji testnet) | Token ERC-20 $PLR — mint/burn on-chain |
| **Solidity** + Hardhat | Smart contracts |

### Infra & Deploy

| Tecnologia | Uso |
|---|---|
| **Render** | Backend (Web Service) + Frontend (Static Site) |
| **Docker Compose** | Infra local (PostgreSQL + Redis) |
| **uv** | Package manager Python |
| **pnpm** | Package manager Node |

---

## Estructura del monorepo

```
plur/
├── backend/              # Django 5.2 + Django Ninja
│   ├── apps/
│   │   ├── users/        # Auth, registro, JWT, preferencias
│   │   ├── sales/        # Prendas, ventas, wallet, mirror AI
│   │   ├── match/        # Conversaciones buyer-seller
│   │   ├── payments/     # Ordenes de compra
│   │   └── early_access/ # Registro early access
│   ├── core/             # AI services, blockchain, email, auth
│   ├── config/           # Settings (base/dev/prod)
│   └── docker/           # Docker Compose (local/dev/prod)
├── frontend/             # React 18 + Vite
│   ├── src/
│   │   ├── features/     # Dashboard, auth, landing, onboarding
│   │   ├── stores/       # Zustand (auth, dashboard, profile)
│   │   ├── api/          # Cliente axios + tipos generados
│   │   ├── pages/        # Rutas (Home, Login, Landing...)
│   │   └── locales/      # Traducciones ES / EN
│   └── public/
├── plr-contracts/        # Smart contracts ERC-20 (Hardhat)
├── docs/                 # Documentacion tecnica (Avalanche)
└── README.md
```

---

## Setup local

### Requisitos

- [Docker](https://docs.docker.com/get-docker/) — PostgreSQL + Redis
- [uv](https://docs.astral.sh/uv/) — package manager Python
- [pnpm](https://pnpm.io/installation) — package manager Node
- Node.js 20+ / Python 3.11+

### Quick start

```bash
# Terminal 1 — Infra
cd backend && docker compose -f docker/local.yml up -d

# Terminal 2 — Backend
cd backend && uv sync && uv run python manage.py migrate && uv run python manage.py runserver

# Terminal 3 — Frontend
cd frontend && pnpm install && pnpm dev
```

---

## Variables de entorno

### Backend

| Variable | Descripcion |
|---|---|
| `DJANGO_SECRET_KEY` | Secret key de Django |
| `DATABASE_URL` | URL de PostgreSQL |
| `CORS_ALLOWED_ORIGINS` | URL del frontend |
| `RESEND_API_KEY` | API key de Resend (emails) |
| `GEMINI_API_KEY` | API key de Google Gemini (IA) |
| `CLOUDINARY_URL` | URL de Cloudinary (imagenes) |
| `AVALANCHE_BACKEND_PRIVATE_KEY` | Private key wallet custodial |

### Frontend

| Variable | Descripcion |
|---|---|
| `VITE_API_BASE_URL` | URL del backend API |

---

## API

La API REST esta documentada automaticamente por Django Ninja:

- **Swagger UI:** [api.plur.wtf/api/docs](https://api.plur.wtf/api/docs)
- **OpenAPI JSON:** [api.plur.wtf/api/openapi.json](https://api.plur.wtf/api/openapi.json)

Para regenerar los tipos TypeScript del frontend:

```bash
cd frontend && pnpm generate:types
```

---

## Equipo

<table>
  <tr>
    <td align="center">
      <a href="https://facundopadilla.com">
        <b>Facundo Padilla</b>
      </a>
      <br />
      <sub>Full Stack Developer</sub>
      <br />
      <a href="https://facundopadilla.com">facundopadilla.com</a>
    </td>
    <td align="center">
      <a href="https://www.linkedin.com/in/mariano-velarde/">
        <b>Mariano Velarde</b>
      </a>
      <br />
      <sub>Product & Business</sub>
      <br />
      <a href="https://www.linkedin.com/in/mariano-velarde/">LinkedIn</a>
    </td>
  </tr>
</table>

---

## Licencia

MIT — Hackathon Aleph 2026
