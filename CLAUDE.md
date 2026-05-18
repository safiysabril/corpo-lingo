# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Corpo Lingo is a corporate language translator. Casual text is rewritten into professional corporate language using an LLM. It is a pnpm monorepo with three packages:

- `apps/backend` — Express 5 + TypeScript REST API
- `apps/frontend` — React 19 + Vite SPA
- `packages/shared` — Shared TypeScript types and constants consumed by both apps

## Commands

All commands are run from the repo root using pnpm filter syntax.

```bash
# Development
pnpm --filter @corpo-lingo/backend dev       # Backend with hot reload (tsx watch)
pnpm --filter @corpo-lingo/frontend dev      # Frontend with HMR (Vite)

# Build
pnpm --filter @corpo-lingo/shared build      # Must run after editing packages/shared
pnpm --filter @corpo-lingo/backend build     # tsc compile to dist/
pnpm --filter @corpo-lingo/frontend build    # tsc + vite build

# Tests (backend only — jest + supertest, runs in-band)
pnpm --filter @corpo-lingo/backend test
pnpm --filter @corpo-lingo/backend test -- --testPathPattern=auth   # single file

# Lint (frontend only)
pnpm --filter @corpo-lingo/frontend lint

# Docker (full stack: postgres + redis + backend + frontend)
docker compose up --build
```

There is no root-level `package.json` script aggregator; always use `--filter`.

**Important:** Any change to `packages/shared` requires running its build before the backend or frontend will pick up the new types.

## Backend Architecture

**Entry point:** `apps/backend/src/server.ts` — loads env, initialises DB, starts Express.

**Request flow for `POST /api/v1/translate`:**
1. `optionalAuthenticate` middleware — attaches `req.user` from JWT cookie if present (guests allowed)
2. `validateTranslation` middleware — validates `text`, `mode`, `formality` via express-validator
3. `translate` controller — checks Redis cache → on miss calls `translateWithFallback` → stores result in Redis → if authenticated, persists row to `translations` table

**AI provider system (`src/services/`):**
- All providers implement the `TranslationService` interface: `translateText(text, mode, formality): Promise<TranslationResult>`
- `ai.factory.ts` selects the provider via `AI_PROVIDER` env var and routes to `groq.service.ts`, `openai.service.ts`, `gemini.service.ts`, or `ollama.service.ts`
- `translateWithFallback` retries with `FALLBACK_PROVIDER` only on HTTP 429 / rate-limit errors

**Caching (`src/utils/cache.ts`):** Redis via `ioredis`. Cache key is SHA-256 of `text|mode|formality`. TTL = 30 days. Redis is optional — if `REDIS_URL` is unset, caching is silently skipped.

**Database (`src/db/index.ts`):** PostgreSQL via `pg`. Tables are created at startup (`initDb`). Retries up to 12 times with 5 s delay — important for Docker startup ordering.

**Auth:** JWT stored in an httpOnly cookie named `token`. `authenticate` requires a valid token; `optionalAuthenticate` allows guests. The `AuthenticatedRequest` type extends `Request` with `user: { sub: number; email: string; name: string }`.

**Email (`src/services/email.service.ts`):** nodemailer. If `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` are set, mail is sent via that SMTP server. Otherwise it auto-creates an [Ethereal](https://ethereal.email) test account and prints a preview URL to the console — no configuration needed for local dev.

**API routes:**
| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | none |
| POST | `/api/v1/auth/register` | none |
| POST | `/api/v1/auth/login` | none |
| POST | `/api/v1/auth/logout` | none |
| GET | `/api/v1/auth/me` | required |
| POST | `/api/v1/auth/forgot-password` | none |
| POST | `/api/v1/auth/reset-password` | none |
| GET | `/api/v1/translate/options` | none |
| POST | `/api/v1/translate` | optional |
| GET | `/api/v1/translate/history` | required |
| DELETE | `/api/v1/translate/history/:id` | required |

Rate limit: 10 requests per 15 min per IP on all `/api/` routes.

## Frontend Architecture

React Router 7 SPA with pages:
- `/` (`Index.tsx`) — translator UI with optional history sidebar
- `/auth` (`Auth.tsx`) — login / register (includes "Forgot password?" link on sign-in tab)
- `/forgot-password` (`ForgotPassword.tsx`) — request a reset link
- `/reset-password` (`ResetPassword.tsx`) — set new password via `?token=` query param

State management: TanStack Query for all server state. Auth state is derived from `GET /api/v1/auth/me` via the `useAuth` hook. UI components are shadcn/ui (Radix-based) with Tailwind CSS v4.

API calls live in `src/api/` (`translateApi.ts`, `authApi.ts`) and communicate with the backend at `/api/v1/` (proxied by Vite in dev, Nginx in Docker).

## Shared Package (`packages/shared`)

- `constants.ts` — `TRANSLATION_MODES` (`email | documentation | formal`) and `FORMALITY_LEVELS` (`low | medium | high`) as const objects with their string union types
- `types.ts` — `TranslatePayload`, `TranslateResponse`, `TranslationHistoryItem`
- `auth.ts` — `RegisterPayload`, `LoginPayload`, `AuthResponse`, `ForgotPasswordPayload`, `ResetPasswordPayload`

Both apps import from `@corpo-lingo/shared` (workspace dependency).

## Environment Variables

Copy `apps/backend/.env.example` to `apps/backend/.env`. Key variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (optional) |
| `JWT_SECRET` | Secret for signing JWTs |
| `AI_PROVIDER` | Primary provider: `groq` \| `openai` \| `gemini` \| `ollama` |
| `FALLBACK_PROVIDER` | Fallback on rate-limit (optional) |
| `GROQ_API_KEY` / `GROQ_MODEL` | Groq credentials and model |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | OpenAI credentials and model |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Google Gemini credentials and model |
| `OLLAMA_HOST` / `OLLAMA_MODEL` | Ollama endpoint and model |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `APP_URL` | Base URL used in password-reset links (default: `http://localhost:5173`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | SMTP credentials for password-reset emails (all optional — omit to use Ethereal in dev) |

## Database Schema

Three tables created automatically by `initDb()`:

- **`users`** — id, name, email (unique), password_hash, created_at
- **`translations`** — id (UUID), user_id (FK), input, output, mode, formality, created_at; indexed on `(user_id, created_at DESC)`
- **`password_reset_tokens`** — id, user_id (FK), token_hash (SHA-256, unique), expires_at (1 h TTL), used_at (set on use for single-use enforcement), created_at; indexed on `token_hash`

The raw token is never stored — only its SHA-256 hash. The plaintext token travels only in the reset URL.

## Testing

Tests live in `apps/backend/tests/`. The test suite mocks `ai.factory` so no real API key is needed. The mock is declared with `jest.mock('../src/services/ai.factory', ...)` at the top of each test file. Tests also do not mock the database — if you add tests that touch DB queries, you'll need to mock `pool` from `src/db/index.ts`.
