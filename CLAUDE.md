# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Overview

**Corpo Lingo** is a corporate language translator: casual text is rewritten into
professional corporate language by an LLM. The user picks a **mode**
(`email` | `documentation` | `formal`) and a **formality level**
(`low` | `medium` | `high`).

pnpm + **Nx** monorepo, three packages:

- `apps/backend` — Express 5 + TypeScript REST API
- `apps/frontend` — React 19 + Vite SPA
- `packages/shared` — Shared TypeScript types & constants consumed by both apps

## Deeper docs (read these for detail)

`docs/` holds focused reference docs — prefer them over re-deriving from source:

- [docs/architecture.md](docs/architecture.md) — system design + request lifecycle
- [docs/local-development.md](docs/local-development.md) — running locally + **why `pnpm dev` needs a DB**
- [docs/backend.md](docs/backend.md) · [docs/frontend.md](docs/frontend.md) — per-app internals
- [docs/api-reference.md](docs/api-reference.md) — every endpoint
- [docs/database.md](docs/database.md) — schema (no migration tool; `initDb()` only)
- [docs/ai-providers.md](docs/ai-providers.md) — provider system + prompts
- [docs/deployment.md](docs/deployment.md) — Docker, CI, env vars

## Commands

Most commands use pnpm filter syntax. Build/test/lint are orchestrated by Nx.

```bash
# Run everything locally (needs a database — see below)
pnpm dev                                       # builds shared once, then runs all apps' dev in parallel

# Per-package dev
pnpm --filter @corpo-lingo/backend dev         # tsx watch
pnpm --filter @corpo-lingo/frontend dev        # vite HMR

# Build (Nx caches these)
pnpm --filter @corpo-lingo/shared build        # REQUIRED after editing packages/shared
pnpm build                                     # nx run-many -t build (all packages)

# Test (backend only — jest + supertest, in-band)
pnpm --filter @corpo-lingo/backend test
pnpm --filter @corpo-lingo/backend test -- --testPathPattern=translate

# Lint (frontend only)
pnpm --filter @corpo-lingo/frontend lint

# Nx variants
pnpm nx-dev    # nx run-many -t dev
pnpm test      # nx run-many -t test
pnpm lint      # nx run-many -t lint
```

**Important:** any change to `packages/shared` requires rebuilding it before the
backend/frontend see the new types. `pnpm dev` does this build once on startup.

## Running locally — `pnpm dev` needs a database

`docker compose up` works out of the box because it starts Postgres + Redis
containers and injects `DATABASE_URL`/`REDIS_URL`. **`pnpm dev` does not start a
database** — the backend's `initDb()` blocks startup until Postgres is reachable, so
without one it fails (`client password must be a string` if `DATABASE_URL` is unset,
or `DB connection attempt N/12 failed`).

To run `pnpm dev`:

```bash
docker compose -f docker-compose.dev.yml up -d   # postgres + redis with host ports
pnpm dev
```

The default `DATABASE_URL` in `.env.example`
(`postgresql://corpo:corpo@localhost:5432/corpo_lingo`) matches this dev infra. If a
**native Postgres** already owns port 5432, see
[docs/local-development.md](docs/local-development.md) (use it directly, or remap to
5433). Redis is optional — without it, caching is skipped (and `[cache] Redis error`
is logged but harmless). Note: this user runs Docker via `sudo` (not in the `docker`
group).

## Backend architecture

**Entry:** `apps/backend/src/server.ts` (env → `initDb()` → `app.listen`). The
Express app is built separately in `src/app.ts` and exported without listening (so
Supertest can import it).

**`POST /api/v1/translate` flow:** `optionalAuthenticate` (attach `req.user` from JWT
cookie; guests allowed) → `validateTranslation` (express-validator) → `translate`
controller: Redis cache lookup → on miss `translateWithFallback` → cache store → if
authenticated, persist a row to `translations`.

**AI providers (`src/services/`):** all implement `TranslationService`
(`translateText(text, mode, formality)`). `ai.factory.ts` selects by `AI_PROVIDER`
and routes to `groq` / `openai` / `gemini` / `ollama`. `translateWithFallback`
retries with `FALLBACK_PROVIDER` only on HTTP 429 / rate-limit errors.

**Caching (`src/utils/cache.ts`):** Redis (`ioredis`); key = `SHA-256(text|mode|formality)`,
TTL 30 days. Optional — skipped if `REDIS_URL` unset.

**Database (`src/db/index.ts`):** Postgres (`pg`). Tables created at startup by
`initDb()` (retries 12× / 5s — important for Docker ordering). No migration tool.

**Auth:** JWT in an httpOnly cookie `token`. `authenticate` requires it;
`optionalAuthenticate` allows guests. `AuthenticatedRequest.user = { sub, email, name }`.
**Google sign-in** (`POST /api/v1/auth/google`): the frontend sends an authorization
code; the controller exchanges it for tokens via `google-auth-library` using
`GOOGLE_CLIENT_SECRET` (backend-only), verifies the ID token, upserts the user
(`google_sub` → email → create), then issues the same cookie. `users.password_hash`
is nullable for Google-only accounts.

**Rate limit:** all `/api/` routes — **100 req/day** authenticated, **10 req/day**
guests (`express-rate-limit`, in-memory). The guest key uses `ipKeyGenerator(req.ip)`
— do **not** revert to raw `req.ip` (throws `ERR_ERL_KEY_GEN_IPV6` in v8).

**Email (`src/services/email.service.ts`):** Resend HTTP API in production
(`RESEND_API_KEY`); Ethereal test inbox in local dev (preview URL logged); skipped +
logged if neither.

**API routes:**

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | none |
| POST | `/api/v1/auth/register` · `login` · `logout` · `google` | none |
| GET | `/api/v1/auth/me` | required |
| POST | `/api/v1/auth/forgot-password` · `reset-password` | none |
| GET | `/api/v1/translate/options` | none |
| POST | `/api/v1/translate` | optional |
| GET | `/api/v1/translate/history` | required |
| DELETE | `/api/v1/translate/history/:id` | required |

## Frontend architecture

React Router 6 SPA (`react-router-dom`). Pages: `/` (`Index.tsx` → `Translator.tsx`),
`/auth`, `/forgot-password`, `/reset-password`, `*` (`NotFound`).

- **Server state:** TanStack Query only. Auth derived from `GET /api/v1/auth/me` via
  the `useAuth` hook (`getMe()` returns `null` on 401 — logged-out is a normal state).
- **UI:** shadcn/ui (Radix) managed via the shadcn CLI (`components.json`) +
  Tailwind CSS v3 (`tailwind.config.ts` + `postcss.config.js`). Theme tokens are CSS
  variables in `src/index.css` (the "Warm Sand" palette).
- **Dark mode:** `next-themes` (`attribute="class"`, `defaultTheme="system"`);
  `ThemeToggle` in the Translator brand tile.
- **Google sign-in:** `GoogleSignInButton` (Google Identity Services, Authorization
  Code popup) → `authApi.googleLogin(code)`. Gated on `VITE_GOOGLE_CLIENT_ID`.
- **API layer:** `src/api/` (`translateApi.ts` = `translateText`; `authApi.ts` =
  auth + history calls), `fetch` with `credentials: 'include'`, relative `/api/v1/`
  paths (proxied by Vite in dev, Nginx in Docker). The `Translator` component holds
  the whole translator UI + history tile.

Built and served as static files by Nginx in Docker; see
[docs/deployment.md](docs/deployment.md).

## Shared package (`packages/shared`)

- `constants.ts` — `TRANSLATION_MODES`, `FORMALITY_LEVELS` (+ description maps) as
  const objects with their union types.
- `types.ts` — `TranslatePayload`, `TranslateResponse`.
- `auth.ts` — `RegisterPayload`, `LoginPayload`, `UserProfile`, `AuthResponse`,
  `ForgotPasswordPayload`, `ResetPasswordPayload`, `TranslationHistoryItem`.

Both apps import from `@corpo-lingo/shared` (workspace dependency). The frontend
aliases it straight to source; the backend consumes the built `dist/`.

## Environment variables

Copy `apps/backend/.env.example` → `apps/backend/.env`. Full table in
[docs/deployment.md](docs/deployment.md). Most-used:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (**required**) |
| `REDIS_URL` | Redis connection (optional — enables caching) |
| `JWT_SECRET` | JWT signing secret |
| `AI_PROVIDER` / `FALLBACK_PROVIDER` | Primary + rate-limit fallback provider |
| `GROQ_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` / `OLLAMA_HOST` | Provider creds |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist |
| `APP_URL` | Base URL in password-reset links |
| `RESEND_API_KEY` / `EMAIL_FROM` | Password-reset email delivery |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in (ID is public; **secret is backend-only**) |

The frontend also needs `VITE_GOOGLE_CLIENT_ID` (same public value as
`GOOGLE_CLIENT_ID`), inlined into the bundle at build time.

## Database schema

Three tables, created by `initDb()`: **`users`**, **`translations`** (UUID id,
FK to users, indexed on `(user_id, created_at DESC)`; only authenticated users'
translations are stored), **`password_reset_tokens`** (SHA-256 token hash only,
1h TTL, single-use). Details in [docs/database.md](docs/database.md).

## Testing

Tests live in `apps/backend/tests/` (jest + supertest). Each test file mocks the AI
layer via `jest.mock('../src/services/ai.factory', ...)` so no real key is needed.
The **database is not mocked** — DB-touching tests must mock `pool` from
`src/db/index.ts`.
