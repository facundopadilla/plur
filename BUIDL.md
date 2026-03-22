<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/facundopadilla/plur/main/frontend/public/plur-banner.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/facundopadilla/plur/main/frontend/public/plur-banner.svg">
  <img alt="Plur — Circular Fashion Redefined" src="https://raw.githubusercontent.com/facundopadilla/plur/main/frontend/public/plur-banner.svg" width="600">
</picture>

<br /><br />

[![Live App](https://img.shields.io/badge/🌐_Live_App-plur.wtf-C8FF00?style=for-the-badge&labelColor=0A0A0A)](https://plur.wtf)
&nbsp;
[![GitHub](https://img.shields.io/badge/📦_Source_Code-GitHub-white?style=for-the-badge&labelColor=0A0A0A)](https://github.com/facundopadilla/plur)
&nbsp;
[![Pitch Deck](https://img.shields.io/badge/📊_Pitch_Deck-Slides-C8FF00?style=for-the-badge&labelColor=0A0A0A)](https://aleph-plur-diapositives.vercel.app/)
&nbsp;
[![API Docs](https://img.shields.io/badge/📄_API_Docs-Swagger-46E3B7?style=for-the-badge&labelColor=0A0A0A)](https://api.plur.wtf/api/docs)

</div>

---

## The Problem

The fashion industry is responsible for **10% of global carbon emissions** and generates **92 million tonnes of textile waste** every year. Fast fashion encourages overconsumption — people buy more than they need and discard garments that still have life in them.

The second-hand market exists, but the current experience is broken:
- **Discovery is terrible** — endless scrolling through unfiltered listings
- **You can't try before you buy** — sizing uncertainty drives returns and abandoned carts
- **Payments are fragmented** — no unified economy that rewards circular behavior

---

## The Solution: Plur

**Plur** is a circular fashion marketplace that makes buying second-hand clothing more engaging, trustworthy, and rewarding than buying new.

We combine three innovations into a single mobile-first experience:

### 1. Swipe Discovery
A Tinder-like interface for browsing garments. Like, pass, or try on — the algorithm learns your style. No more infinite scrolling through irrelevant listings.

### 2. AI Virtual Try-On
Upload a reference photo and see yourself wearing any garment before purchasing. Powered by **Google Gemini**, the AI generates realistic try-on images in seconds. This solves the #1 barrier to second-hand shopping: *"will it look good on me?"*

### 3. Tokenized Economy ($PLR)
Every transaction runs through the **$PLR token**, an ERC-20 on **Avalanche C-Chain**. Users never need to know they're using crypto — the backend acts as a custodial intermediary:

- **Buy PLR** with credit card (ARS, USD, EUR, BRL, CLP, MXN) → tokens are minted on-chain
- **Spend PLR** to purchase garments or generate AI try-ons → tokens are burned
- **Earn PLR** by publishing your own garments for sale
- **Every transaction** is verifiable on [Snowtrace](https://testnet.snowtrace.io/)

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                        USER FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. SIGN UP → Email verification → Onboarding (style quiz) │
│                         ↓                                   │
│  2. SWIPE → Browse garments → Like / Pass / Try On          │
│                         ↓                                   │
│  3. MATCH → Chat with seller → Negotiate                    │
│                         ↓                                   │
│  4. BUY PLR → Card payment → On-chain mint (Avalanche)      │
│                         ↓                                   │
│  5. PURCHASE → PLR transfer → Garment changes hands         │
│                         ↓                                   │
│  6. PUBLISH → Upload photo → AI auto-fills metadata         │
│                         ↓                                   │
│  7. EARN → Your garment sells → You earn PLR                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   React SPA     │────▶│  Django Ninja    │────▶│  PostgreSQL      │
│   (plur.wtf)    │ API │  (api.plur.wtf)  │     │  + Redis         │
│                 │◀────│                  │     │                  │
│  Vite 6         │ JWT │  JWT Auth        │     └──────────────────┘
│  Tailwind v4    │     │  Async Views     │
│  Zustand        │     │  OpenAPI Auto    │     ┌──────────────────┐
│  TanStack Query │     │                  │────▶│  Google Gemini   │
│  react-i18next  │     │                  │     │  (AI Try-On +    │
└─────────────────┘     │                  │     │   Garment        │
                        │                  │     │   Analysis)      │
                        │                  │     └──────────────────┘
                        │                  │
                        │                  │     ┌──────────────────┐
                        │                  │────▶│  Avalanche       │
                        │                  │     │  C-Chain (Fuji)  │
                        └──────────────────┘     │  $PLR ERC-20     │
                                                 └──────────────────┘
```

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript (strict) | UI framework with full type safety |
| Vite 6 | Bundler with code splitting (vendor, query, ui chunks) |
| Tailwind CSS v4 + shadcn/ui | Design system with custom tokens |
| Zustand + persist | Client state (auth, UI preferences) |
| TanStack Query v5 | Server state with automatic cache invalidation |
| react-i18next | Full i18n support (Spanish / English) |

### Backend
| Technology | Purpose |
|---|---|
| Django 5.2 (async) | Web framework with async views |
| Django Ninja | REST API with auto-generated OpenAPI schema |
| PostgreSQL + Redis | Primary database + caching layer |
| JWT (httpOnly cookies) | Secure auth — access token in memory, refresh in cookie |
| Resend + django-anymail | Transactional emails with domain verification |

### AI & Blockchain
| Technology | Purpose |
|---|---|
| Google Gemini | Virtual try-on generation + garment metadata analysis |
| Cloudinary | CDN for AI-generated images |
| Avalanche C-Chain (Fuji) | ERC-20 token with mint/burn/pause capabilities |
| Solidity + Hardhat + OpenZeppelin | Smart contract with AccessControl, Pausable, Permit |

---

## Smart Contract: $PLR Token

The `PLRToken.sol` contract implements a custodial ERC-20 with role-based access control:

```solidity
contract PLRToken is ERC20, ERC20Pausable, AccessControl, ERC20Permit {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
}
```

**Key design decisions:**
- **Custodial model** — The Django backend holds `MINTER_ROLE` and `BURNER_ROLE`. Users don't need wallets or MetaMask.
- **Reference ID deduplication** — Every mint/burn has a unique `referenceId` (mapped to `_usedReferenceIds`) to prevent double-spend.
- **Pausable** — Admin can freeze all transfers in case of emergency.
- **Permit** — Supports gasless approvals via EIP-2612 signatures.
- **Events** — `CreditsIssued` and `CreditsBurned` for full audit trail.

---

## Key Features Implemented

| Feature | Status | Description |
|---|---|---|
| Swipe Discovery | ✅ Live | Tinder-like card stack with drag gestures and undo |
| AI Virtual Try-On | ✅ Live | Upload photo → Gemini generates you wearing the garment |
| AI Garment Analysis | ✅ Live | Upload garment photo → AI auto-fills name, size, style, condition |
| Match Popup | ✅ Live | Like a garment → popup with "Chat with seller" or "Try on with AI" |
| Real-time Chat | ✅ Live | Buyer-seller messaging with unread indicators |
| PLR Purchase | ✅ Live | Multi-currency calculator → card payment → on-chain mint |
| Garment Publishing | ✅ Live | Photo upload + AI metadata + currency pricing |
| JWT Auth | ✅ Live | Secure login/signup with email verification |
| Onboarding | ✅ Live | Style quiz → size → color preferences (per-user persistence) |
| i18n | ✅ Live | Full Spanish / English support with runtime toggle |
| Mobile-first | ✅ Live | Responsive design, safe-area support, iOS viewport fixes |
| Auto-reload on deploy | ✅ Live | Stale chunk detection → automatic page refresh |

---

## What Makes Plur Different

| | Traditional Marketplaces | Plur |
|---|---|---|
| **Discovery** | Search + filter → scroll | Swipe → instant decisions |
| **Try before buy** | Not possible | AI virtual try-on with your photo |
| **Payments** | Fiat only, platform-locked | Tokenized ($PLR) with on-chain transparency |
| **Seller onboarding** | Manual listing (10+ fields) | Upload photo → AI fills everything |
| **Incentives** | Platform takes a cut | Sellers earn PLR, buyers spend PLR |
| **Trust** | Platform reputation score | On-chain transaction history |

---

## Deployment

| Service | URL | Platform |
|---|---|---|
| Frontend (SPA) | [plur.wtf](https://plur.wtf) | Render (Static Site) |
| Backend API | [api.plur.wtf](https://api.plur.wtf/api/health) | Render (Web Service) |
| API Documentation | [api.plur.wtf/api/docs](https://api.plur.wtf/api/docs) | Auto-generated (Django Ninja) |
| Smart Contract | Avalanche C-Chain (Fuji Testnet) | Hardhat deployment |
| DNS | Cloudflare | Custom domain + SSL |

---

## Run Locally

```bash
# Clone
git clone https://github.com/facundopadilla/plur.git
cd plur

# Backend (Terminal 1 + 2)
cd backend
docker compose -f docker/local.yml up -d    # PostgreSQL + Redis
uv sync && uv run python manage.py migrate
uv run python manage.py runserver            # :8000

# Frontend (Terminal 3)
cd frontend
pnpm install && pnpm dev                     # :5173
```

The Vite dev server proxies `/api/*` to Django — no CORS needed locally.

---

## Team

<table>
  <tr>
    <td align="center">
      <a href="https://facundopadilla.com"><b>Facundo Padilla</b></a>
      <br />
      <sub>Full Stack Developer</sub>
      <br />
      <a href="https://facundopadilla.com">facundopadilla.com</a>
    </td>
    <td align="center">
      <a href="https://www.linkedin.com/in/mariano-velarde/"><b>Mariano Velarde</b></a>
      <br />
      <sub>Product Manager</sub>
      <br />
      <a href="https://www.linkedin.com/in/mariano-velarde/">LinkedIn</a>
    </td>
  </tr>
</table>

---

## License

MIT — Built for [Aleph Hackathon 2026](https://www.aleph.crecimiento.build)
