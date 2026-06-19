# Corpo Lingo

Turn casual text into polished corporate language. Paste what you actually mean,
pick a **mode** (email / documentation / formal) and a **formality level**
(low / medium / high), and an LLM rewrites it professionally — buzzword-free.

Guests can translate freely; signing in adds saved history. Also includes voice
input, dark mode, and password reset.

**Authors:** Zana & Safiy

---

## Contents

- [Stack](#stack)
- [Quick start](#quick-start)
- [Project layout](#project-layout)
- [Documentation](#documentation)
- [Common commands](#common-commands)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Stack

| Layer | Tech |
|-------|------|
| Monorepo | pnpm workspaces + Nx |
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS 4, shadcn/ui (Radix), TanStack Query, React Router 7 |
| Backend | Node 22, Express 5, TypeScript |
| Database | PostgreSQL 16 (users + translation history) |
| Cache | Redis 7 (optional — caches translations, 30-day TTL) |
| Auth | JWT in an httpOnly cookie + bcryptjs |
| AI | Pluggable: **Groq** (default) · OpenAI · Google Gemini · Ollama (local) |
| Email | Resend HTTP API (prod) / Ethereal (dev) for password reset |
| Infra | Docker multi-stage builds + Nginx + Docker Compose |
| Tests | Jest + Supertest (backend) |

---

## Quick start

### Prerequisites

- Node.js 22+ and pnpm 9+ (`corepack enable && corepack prepare pnpm@9 --activate`)
- Docker (for the database, or bring your own Postgres)
- An AI provider key — [Groq](https://console.groq.com) has a generous free tier

### 1. Install & configure

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
# edit apps/backend/.env → set your AI key (e.g. GROQ_API_KEY) and a JWT_SECRET
```

### 2. Run it

**Option A — local dev with hot reload (recommended while coding):**

```bash
docker compose -f docker-compose.dev.yml up -d   # start Postgres + Redis only
pnpm dev                                          # run backend + frontend on the host
```

> `pnpm dev` runs the apps directly and **needs a database** — that's what the dev
> Compose file provides. Its default credentials match the `DATABASE_URL` shipped in
> `.env.example`. (Full explanation, plus the "I already run Postgres on 5432" case,
> in [docs/local-development.md](docs/local-development.md).)

**Option B — full stack in Docker (no Node needed on the host):**

```bash
docker compose up --build
```

| | Local dev (A) | Docker (B) |
|---|---|---|
| Frontend | http://localhost:5173 | http://localhost (port 80) |
| Backend | http://localhost:3000 | http://localhost:3000 |
| Health | http://localhost:3000/health | same |

> If `docker` needs `sudo` on your machine, prefix the Compose commands with `sudo`
> (or add yourself to the `docker` group).

---

## Project layout

```
corpo-lingo/
├── apps/
│   ├── backend/     Express 5 REST API  (@corpo-lingo/backend)
│   └── frontend/    React + Vite SPA    (@corpo-lingo/frontend)
├── packages/
│   └── shared/      Shared types & constants (@corpo-lingo/shared)
├── docs/            Reference documentation (start at docs/README.md)
├── docker-compose.yml       Full stack
├── docker-compose.dev.yml   Postgres + Redis only, for `pnpm dev`
├── nx.json
└── package.json
```

---

## Documentation

In-depth docs live in [`docs/`](docs/README.md):

| Doc | What's inside |
|-----|---------------|
| [architecture.md](docs/architecture.md) | System design + the translate request lifecycle |
| [local-development.md](docs/local-development.md) | Running locally, the DB requirement, troubleshooting |
| [backend.md](docs/backend.md) / [frontend.md](docs/frontend.md) | Per-app internals |
| [api-reference.md](docs/api-reference.md) | Every endpoint with request/response shapes |
| [database.md](docs/database.md) | Schema and tables |
| [ai-providers.md](docs/ai-providers.md) | Provider system, prompts, adding a provider |
| [deployment.md](docs/deployment.md) | Docker images, CI/CD, environment variables |

`CLAUDE.md` is a condensed map of the same material for AI coding assistants.

---

## Common commands

```bash
pnpm dev                                       # build shared once, run all apps (needs a DB)
pnpm build                                     # nx run-many -t build
pnpm test                                      # nx run-many -t test
pnpm lint                                      # nx run-many -t lint

pnpm --filter @corpo-lingo/backend dev         # backend only (tsx watch)
pnpm --filter @corpo-lingo/frontend dev        # frontend only (vite)
pnpm --filter @corpo-lingo/shared build        # REQUIRED after editing packages/shared
pnpm --filter @corpo-lingo/backend test        # jest + supertest
```

> Editing `packages/shared`? Rebuild it or the apps won't see the new types
> (`pnpm dev` does this once on startup).

---

## Configuration

All config is in `apps/backend/.env` (see `.env.example`). The frontend needs none.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | **yes** | PostgreSQL connection string |
| `JWT_SECRET` | yes (prod) | Signs auth JWTs |
| `REDIS_URL` | no | Enables translation caching |
| `AI_PROVIDER` | no | `groq` (default) · `openai` · `gemini` · `ollama` |
| `FALLBACK_PROVIDER` | no | Provider to try on a rate-limit (429) |
| `GROQ_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` / `OLLAMA_HOST` | per provider | Provider credentials |
| `ALLOWED_ORIGINS` | no | Comma-separated CORS allowlist |
| `APP_URL` | no | Base URL in password-reset links |
| `RESEND_API_KEY` / `EMAIL_FROM` | no | Password-reset email delivery |

Full table and a production checklist: [docs/deployment.md](docs/deployment.md).

**Rate limits:** 100 requests/day for signed-in users, 10/day for guests, per
`/api/` route.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `pnpm dev`: `client password must be a string` | `DATABASE_URL` unset — it's in `.env.example`; make sure your `.env` has it. |
| `pnpm dev`: `DB connection attempt N/12 failed` | No reachable Postgres. Start `docker compose -f docker-compose.dev.yml up -d` first. |
| `password authentication failed for user "corpo"` | A different Postgres is on 5432. See [docs/local-development.md](docs/local-development.md). |
| `[cache] Redis error` (repeating) | No Redis — start the dev infra, or comment out `REDIS_URL` (caching just gets skipped). |
| `Cannot find module '@corpo-lingo/shared'` | `pnpm --filter @corpo-lingo/shared build` |
| `Translation service is not configured` (503) | Set your provider's API key in `.env`. |

More in [docs/local-development.md](docs/local-development.md#troubleshooting).
