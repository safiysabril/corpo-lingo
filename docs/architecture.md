# Architecture

## System overview

```
                    ┌─────────────────────────────────────────────┐
                    │                  Browser                     │
                    │   React 19 SPA (Vite build, served static)   │
                    └───────────────────┬─────────────────────────┘
                                        │  /api/v1/*  (httpOnly cookie auth)
                          dev: Vite proxy │ prod: Nginx reverse proxy
                                        ▼
                    ┌─────────────────────────────────────────────┐
                    │           Express 5 API (apps/backend)       │
                    │  helmet · cors · rate-limit · cookie-parser  │
                    │  routes → middleware → controllers           │
                    └───────┬──────────────┬───────────────┬───────┘
                            │              │               │
                  ┌─────────▼──┐   ┌───────▼──────┐  ┌─────▼───────────┐
                  │ PostgreSQL │   │    Redis     │  │  AI provider    │
                  │ users +    │   │ translation  │  │ Groq / OpenAI / │
                  │ history    │   │ cache (30d)  │  │ Gemini / Ollama │
                  └────────────┘   └──────────────┘  └─────────────────┘
```

Both Postgres and Redis are **optional infrastructure for the frontend** but the
backend treats them differently:

- **Postgres is required** — the server calls `initDb()` on boot and will not start
  until it connects (retries 12× with a 5s delay). Without it, `pnpm dev` fails.
- **Redis is optional** — if `REDIS_URL` is unset, caching is silently skipped. If it
  is set but unreachable, the backend logs `[cache] Redis error` and continues.

See [local-development.md](local-development.md) for why this matters when running
outside Docker.

## Monorepo layout

```
corpo-lingo/
├── apps/
│   ├── backend/     @corpo-lingo/backend  — Express 5 + TypeScript REST API
│   └── frontend/    @corpo-lingo/frontend — React 19 + Vite SPA
├── packages/
│   └── shared/      @corpo-lingo/shared   — types + constants used by both apps
├── docker-compose.yml       full stack (postgres + redis + backend + frontend)
├── docker-compose.dev.yml   infra only (postgres + redis) for `pnpm dev`
├── nx.json                  Nx task runner config
└── package.json             root scripts (dev / build / test / lint)
```

**Tooling:** pnpm workspaces for dependency management + Nx (`nx run-many`) for
build/test/lint task orchestration with caching. There is **no root build script
aggregator beyond Nx** — most day-to-day commands use `pnpm --filter <pkg>`.

## The translate request lifecycle

`POST /api/v1/translate` is the core path. In order:

1. **`optionalAuthenticate`** middleware — reads the `token` cookie. If a valid JWT
   is present, attaches `req.user = { sub, email, name }`. Guests are allowed
   through with no user.
2. **`validateTranslation`** middleware — `express-validator` checks `text`
   (3–5000 chars), `mode` (one of the 3 modes), `formality` (one of the 3 levels).
   On failure returns `422`.
3. **`translate`** controller (`controllers/translate.controller.ts`):
   - Builds a cache key = `SHA-256(text|mode|formality)`.
   - **Cache hit** → return the cached output, skip the LLM entirely.
   - **Cache miss** → `translateWithFallback()` calls the configured AI provider,
     then stores the result in Redis (30-day TTL).
   - If the request is **authenticated**, inserts a row into `translations`
     (guests' translations are never persisted).
   - Returns `{ success, data: { id, original, translated, mode, formality }, meta }`.

```
request → optionalAuthenticate → validateTranslation → translate controller
                                                            │
                                          cache hit? ──yes──┴─→ return cached
                                             │ no
                                             ▼
                                   translateWithFallback (provider, then fallback on 429)
                                             │
                                             ▼
                                   store in Redis · persist if logged in · respond
```

## Auth model

- Stateless **JWT** stored in an **httpOnly cookie** named `token` (7-day expiry,
  `SameSite=lax`, `Secure` in production).
- `authenticate` middleware → **requires** a valid token (401 otherwise).
- `optionalAuthenticate` middleware → attaches the user if a token is present,
  otherwise continues as a guest.
- Passwords hashed with **bcryptjs (cost 12)**. Password-reset tokens are random
  32-byte values; only their SHA-256 hash is stored, single-use, 1-hour TTL.

## Rate limiting

Applied to all `/api/` routes via `express-rate-limit` (in-memory store):

- **100 requests / day** for authenticated users (keyed by `user:<id>`)
- **10 requests / day** for guests (keyed by `guest:<ip>`)

The key generator inspects the JWT cookie itself to decide the limit and key. Guest
IPs run through `ipKeyGenerator()` so IPv6 clients can't bypass limits by hopping
addresses. See [backend.md](backend.md#rate-limiting) for details.

## Shared types as the contract

`packages/shared` is the single source of truth for the request/response contract:
`TranslationMode`, `FormalityLevel`, `TranslatePayload`, `TranslateResponse`,
`TranslationHistoryItem`, and all auth payloads. Both the backend (validation,
controllers) and frontend (API client, UI) import from `@corpo-lingo/shared`, so
the API and UI can't drift on enum values or payload shapes.
