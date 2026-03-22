![Plur — Circular Fashion Redefined](https://raw.githubusercontent.com/facundopadilla/plur/main/frontend/public/plur-banner.svg)

# Plur — Circular Fashion Redefined

**Live App:** [plur.wtf](https://plur.wtf) | **GitHub:** [facundopadilla/plur](https://github.com/facundopadilla/plur) | **Pitch Deck:** [Slides](https://aleph-plur-diapositives.vercel.app/) | **API Docs:** [Swagger](https://api.plur.wtf/api/docs)

---

## What is Plur?

Plur is a **circular fashion marketplace** where users discover second-hand garments by swiping (like Tinder), try them on virtually using AI, and buy or trade them using **$PLR tokens** on **Avalanche C-Chain**.

The fashion industry generates 92 million tonnes of textile waste per year. The second-hand market can fix this, but today's experience is broken: discovery is tedious, you can't try anything on, and there's no incentive system to reward circular behavior. Plur solves all three.

The app is **fully deployed and functional** at [plur.wtf](https://plur.wtf) — not a prototype, a working product.

---

## Core Features

**Swipe Discovery** — Users browse garments in a card stack with drag gestures, like/pass, and undo. The interface is fast, fun, and eliminates endless scrolling. When you like a garment, a match popup lets you immediately chat with the seller or try it on with AI.

**AI Virtual Try-On** — Upload a reference photo of yourself and Plur uses Google Gemini to generate a realistic image of you wearing the garment. This is the biggest barrier in second-hand shopping ("will it fit me?") and we solve it in seconds.

**AI Garment Analysis** — Sellers upload a single photo and the AI automatically detects and fills in the garment name, size, style, condition, and suggested price. Publishing a listing takes under 30 seconds.

**$PLR Token Economy** — Every transaction uses PLR, an ERC-20 token on Avalanche C-Chain (Fuji testnet). Users buy PLR with a credit card in 6 currencies (ARS, USD, EUR, BRL, CLP, MXN) — the backend mints tokens on-chain. When they purchase a garment or generate an AI try-on, tokens are burned. Sellers earn PLR when their garments sell. Users never need a wallet or MetaMask — the backend acts as a custodial intermediary.

**Real-time Chat** — Buyer and seller communicate directly within the app. Conversations have unread indicators and role labels (Buying/Selling).

**Bilingual** — Full Spanish and English support with a runtime toggle on the landing page.

---

## How It Works

1. **Sign up** with email verification and complete the onboarding quiz (style, sizes, colors)
2. **Swipe** through garments — like, pass, or try on with AI
3. **Match** — when you like a garment, chat with the seller or try it on virtually
4. **Buy PLR** with your credit card — tokens are minted on Avalanche
5. **Purchase** the garment — PLR is transferred to the seller, verifiable on Snowtrace
6. **Publish** your own clothes — upload a photo and AI fills the listing for you
7. **Earn PLR** when someone buys your garment

---

## Smart Contract

`PLRToken.sol` is an ERC-20 built with OpenZeppelin (AccessControl + Pausable + Permit):

- **Custodial model** — The backend holds MINTER and BURNER roles. Users don't interact with the blockchain directly.
- **Deduplication** — Every mint/burn requires a unique `referenceId` to prevent double-spend.
- **Pausable** — Admin can freeze all transfers in case of emergency.
- **Full audit trail** — `CreditsIssued` and `CreditsBurned` events for every operation.

---

## Tech Stack

**Frontend:** React 18, TypeScript (strict), Vite 6, Tailwind CSS v4 + shadcn/ui, Zustand, TanStack Query v5, react-i18next

**Backend:** Django 5.2 (async), Django Ninja (auto-generated OpenAPI), PostgreSQL, Redis, JWT auth (httpOnly cookies), Resend for transactional emails

**AI:** Google Gemini for virtual try-on and garment analysis, Cloudinary for image CDN

**Blockchain:** Avalanche C-Chain (Fuji testnet), Solidity + Hardhat + OpenZeppelin, ERC-20 with mint/burn/pause

**Infra:** Render (backend Web Service + frontend Static Site), Cloudflare DNS

---

## Deployment

- **App:** [plur.wtf](https://plur.wtf)
- **API:** [api.plur.wtf](https://api.plur.wtf/api/health)
- **API Docs:** [api.plur.wtf/api/docs](https://api.plur.wtf/api/docs)
- **Contract:** Avalanche C-Chain — Fuji Testnet

---

## Team

- **Facundo Padilla** — Full Stack Developer — [facundopadilla.com](https://facundopadilla.com)
- **Mariano Velarde** — Product Manager — [LinkedIn](https://www.linkedin.com/in/mariano-velarde/)

---

MIT — Built for [Aleph Hackathon 2026](https://www.aleph.crecimiento.build)
