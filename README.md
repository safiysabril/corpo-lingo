# Corpo Lingo

A full-stack web app that rewrites casual text into professional corporate language. Choose a **mode** (email / documentation / formal) and a **formality level** (low / medium / high), and an LLM rewrites the input accordingly. Authenticated users get their translation history saved and can revisit or delete past translations.

**Authors:** Zana & Safiy

---

## Table of Contents

- [Stack at a Glance](#stack-at-a-glance)
- [Repository Layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Quick Start — Local Development](#quick-start--local-development)
- [Quick Start — Docker](#quick-start--docker)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [AI Providers](#ai-providers)
- [Translation Modes & Formality](#translation-modes--formality)
- [Scripts Reference](#scripts-reference)
- [Architecture Notes](#architecture-notes)
- [Extending the System](#extending-the-system)
- [Testing](#testing)
- [Production Build & Deployment](#production-build--deployment)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

---

## Stack at a Glance

| Layer       | Technology                                                                |
| ----------- | ------------------------------------------------------------------------- |
| Monorepo    | pnpm workspaces + Nx                                                      |
| Frontend    | React 19, Vite 8, TypeScript, Tailwind CSS 4, Radix UI / shadcn-ui        |
| Backend     | Node 22, Express 5, TypeScript (CommonJS output)                          |
| Database    | PostgreSQL 16 — users & translation history                               |
| Auth        | JWT (httpOnly cookie, 7-day expiry) + bcryptjs password hashing           |
| Shared      | TypeScript types & constants consumed by both sides                       |
| AI          | Pluggable: Groq SDK (default) · OpenAI · Ollama (local)                   |
| Infra       | Docker (multi-stage) + Nginx + docker-compose                             |
| Testing     | Jest + Supertest (backend)                                                |

---

## Repository Layout

```
corpo-lingo/
├── apps/
│   ├── backend/                 # Express API server
│   │   ├── src/
│   │   │   ├── app.ts                  # Express app (middleware, routes wired in)
│   │   │   ├── server.ts               # Entry point — listens on PORT
│   │   │   ├── db/
│   │   │   │   └── index.ts            # pg Pool + initDb() (creates tables on start)
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts  # register / login / logout / me
│   │   │   │   └── translate.controller.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   └── translate.routes.ts
│   │   │   ├── middleware/
│   │   │   │   ├── authenticate.ts     # authenticate / optionalAuthenticate (JWT)
│   │   │   │   ├── validate.ts         # express-validator rules
│   │   │   │   ├── errorHandler.ts     # central error catch
│   │   │   │   └── notFound.ts         # 404 handler
│   │   │   ├── services/
│   │   │   │   ├── ai.factory.ts       # selects provider from AI_PROVIDER
│   │   │   │   ├── groq.service.ts
│   │   │   │   ├── openai.service.ts
│   │   │   │   ├── ollama.service.ts
│   │   │   │   └── types.ts            # TranslationService interface
│   │   │   └── utils/
│   │   │       └── promptBuilder.ts    # buildSystemPrompt / buildUserMessage
│   │   ├── tests/                      # Jest + Supertest specs
│   │   ├── Dockerfile
│   │   └── tsconfig.json
│   │
│   └── frontend/                # React + Vite SPA
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── pages/
│       │   │   ├── Index.tsx           # wraps Translator
│       │   │   ├── Auth.tsx            # login / register page
│       │   │   └── NotFound.tsx
│       │   ├── components/
│       │   │   ├── Translator.tsx      # main UI + history sidebar
│       │   │   ├── ProtectedRoute.tsx
│       │   │   └── ui/                 # shadcn-ui primitives
│       │   ├── hooks/
│       │   │   └── useAuth.ts          # useAuth / useLogout (React Query)
│       │   └── api/
│       │       ├── translateApi.ts
│       │       └── authApi.ts          # register / login / logout / getMe / history
│       ├── index.html
│       ├── vite.config.ts
│       ├── Dockerfile
│       └── tsconfig.json
│
├── packages/
│   └── shared/                  # @corpo-lingo/shared — workspace package
│       ├── src/
│       │   ├── types.ts                # TranslatePayload, TranslateResponse
│       │   ├── auth.ts                 # RegisterPayload, LoginPayload, UserProfile,
│       │   │                           #   AuthResponse, TranslationHistoryItem
│       │   ├── constants.ts            # TRANSLATION_MODES, FORMALITY_LEVELS, …
│       │   └── index.ts                # barrel
│       └── tsconfig.json
│
├── docker-compose.yml
├── pnpm-workspace.yaml
├── nx.json
└── package.json                 # root workspace
```

---

## Prerequisites

- **Node.js 22+** (LTS recommended)
- **pnpm 9+** — `corepack enable && corepack prepare pnpm@9 --activate`
- **PostgreSQL 16+** (local dev) — or skip this and use Docker instead
- **Docker** (optional — runs everything including Postgres in containers)
- An **AI provider API key** (Groq is recommended; it has a generous free tier)

---

## Quick Start — Local Development

```bash
# 1. Clone & install
git clone <repo-url>
cd corpo-lingo
pnpm install

# 2. Configure the backend
cp apps/backend/.env.example apps/backend/.env
# → open apps/backend/.env and fill in:
#   DATABASE_URL, JWT_SECRET, and your AI provider key

# 3. Run everything
pnpm dev
```

`pnpm dev` (root) does two things:

1. Builds `@corpo-lingo/shared` once so the workspace can resolve its compiled output.
2. Starts the frontend and backend in parallel via pnpm filters.

On first start the backend calls `initDb()` which creates the `users` and `translations` tables if they don't exist yet (up to 12 retries with 5 s backoff, in case Postgres is still booting).

You should see:

| Service  | URL                              |
| -------- | -------------------------------- |
| Frontend | http://localhost:5173            |
| Backend  | http://localhost:3000            |
| Health   | http://localhost:3000/health     |

The Vite dev server proxies `/api/*` → `http://localhost:3000`, so the frontend talks to the backend via same-origin requests during development (see [`apps/frontend/vite.config.ts`](apps/frontend/vite.config.ts)).

> If you edit files inside `packages/shared`, run `pnpm --filter @corpo-lingo/shared build` (or `pnpm --filter @corpo-lingo/shared dev` for watch mode) so the consumers pick up the updated `dist/`.

---

## Quick Start — Docker

The whole stack ships as three services orchestrated via `docker-compose.yml`: a PostgreSQL database, a Node 22 Alpine backend, and an Nginx-served static frontend.

```bash
# Build & launch all three services
docker compose up --build

# Or detached
docker compose up -d --build
```

| Service  | Container Port | Host Port |
| -------- | -------------- | --------- |
| postgres | 5432           | —         |
| backend  | 3000           | 3000      |
| frontend | 80             | 80        |

Postgres is only accessible inside the compose network (`DATABASE_URL` is injected into the backend container automatically). The frontend Nginx config proxies `/api/*` → `http://backend:3000`.

Startup order is enforced by healthchecks:
1. `postgres` must pass `pg_isready` before `backend` starts.
2. `backend` must pass `GET /health` before `frontend` starts.

Translation history persists in the named volume `postgres-data`. To wipe it:

```bash
docker compose down -v
```

---

## Environment Variables

The backend reads its config from `apps/backend/.env`. A template lives at `apps/backend/.env.example`.

| Variable          | Required                   | Default                          | Description                                                                 |
| ----------------- | -------------------------- | -------------------------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`    | **yes**                    | —                                | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost:5432/db`. |
| `JWT_SECRET`      | **yes** (in production)    | `dev-secret-change-in-production`| Secret used to sign and verify JWT tokens. Change this in production.       |
| `PORT`            | no                         | `3000`                           | Port the Express server binds to.                                           |
| `NODE_ENV`        | no                         | `development`                    | When `development`, error responses include `detail` (stack/message).       |
| `AI_PROVIDER`     | no                         | `openai`                         | One of `groq`, `openai`, `ollama`.                                          |
| `ALLOWED_ORIGINS` | no                         | `http://localhost:5173`          | Comma-separated CORS allowlist, e.g. `http://localhost:5173,https://app.example.com`. |
| `GROQ_API_KEY`    | if `AI_PROVIDER=groq`      | —                                | Groq Cloud API key.                                                         |
| `GROQ_MODEL`      | no                         | `llama-3.3-70b-versatile`        | Override the Groq model.                                                    |
| `OPENAI_API_KEY`  | if `AI_PROVIDER=openai`    | —                                | OpenAI API key.                                                             |
| `OPENAI_MODEL`    | no                         | `gpt-4o-mini`                    | Override the OpenAI model.                                                  |
| `OLLAMA_HOST`     | no                         | `http://localhost:11434`         | Base URL of a running Ollama instance.                                      |
| `OLLAMA_MODEL`    | no                         | `llama3`                         | Ollama model tag to use.                                                    |

> Rate limiting is hardcoded in [`apps/backend/src/app.ts`](apps/backend/src/app.ts) at 100 requests per 15 minutes per IP on all `/api/*` routes.

The frontend has no required env vars — its API base path is `/api/v1` resolved relative to the current origin.

---

## API Reference

Base path: `/api/v1`

### `GET /health`

Liveness probe used by Docker and load balancers.

**Response 200**
```json
{
  "success": true,
  "message": "Corpo Lingo API is running.",
  "timestamp": "2026-05-05T10:00:00.000Z",
  "version": "1.0.0"
}
```

---

### Auth — `/api/v1/auth`

#### `POST /api/v1/auth/register`

Create a new account. Sets an httpOnly `token` cookie on success.

**Request body**
```json
{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "s3cr3t!!" }
```

**Validation:** `name` non-empty · `email` valid · `password` ≥ 8 chars

**Response 201**
```json
{ "success": true, "user": { "id": 1, "name": "Ada Lovelace", "email": "ada@example.com" } }
```

**Errors:** `409` email already in use · `422` validation failed

---

#### `POST /api/v1/auth/login`

Authenticate an existing user. Sets the `token` cookie.

**Request body**
```json
{ "email": "ada@example.com", "password": "s3cr3t!!" }
```

**Response 200** — same shape as register · **Error:** `401` invalid credentials

---

#### `POST /api/v1/auth/logout`

Clears the `token` cookie.

**Response 200**
```json
{ "success": true }
```

---

#### `GET /api/v1/auth/me`

Returns the currently authenticated user. Requires the `token` cookie.

**Response 200**
```json
{ "success": true, "user": { "id": 1, "name": "Ada Lovelace", "email": "ada@example.com" } }
```

**Error:** `401` missing or invalid token

---

### Translate — `/api/v1/translate`

#### `GET /api/v1/translate/options`

Returns valid `mode` and `formality` values.

**Response 200**
```json
{
  "success": true,
  "data": { "modes": ["email", "documentation", "formal"], "formality": ["low", "medium", "high"] }
}
```

---

#### `POST /api/v1/translate`

Translates `text` into corporate language. Works for both guests and authenticated users. When authenticated, the result is saved to history.

**Request body**
```json
{ "text": "yo, can we chat about the project?", "mode": "email", "formality": "high" }
```

**Validation rules:**

| Field       | Rule                                              |
| ----------- | ------------------------------------------------- |
| `text`      | string, 3–5000 chars, required                    |
| `mode`      | one of `email`, `documentation`, `formal`         |
| `formality` | one of `low`, `medium`, `high`                    |

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-...",
    "original": "yo, can we chat about the project?",
    "translated": "Good day. I would like to discuss the project at your convenience.",
    "mode": "email",
    "formality": "high"
  },
  "meta": {
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "usage": { "prompt_tokens": 150, "completion_tokens": 25, "total_tokens": 175 },
    "timestamp": "2026-05-05T10:00:00.000Z"
  }
}
```

**Error responses:**

| Status | Reason                                   |
| ------ | ---------------------------------------- |
| 422    | Validation failed                        |
| 429    | Rate limit exceeded                      |
| 502    | Upstream AI provider error               |
| 503    | Provider not configured (missing API key)|

---

#### `GET /api/v1/translate/history`

Returns the last 50 translations for the authenticated user, newest first. Requires authentication.

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-...",
      "input": "yo, can we chat?",
      "output": "I would like to schedule a discussion.",
      "mode": "email",
      "formality": "high",
      "createdAt": "2026-05-05T10:00:00.000Z"
    }
  ]
}
```

---

#### `DELETE /api/v1/translate/history/:id`

Deletes a single history item belonging to the authenticated user. Requires authentication.

**Response 200** `{ "success": true }` · **Error:** `404` item not found or not owned by user

---

## AI Providers

The backend resolves an AI service per request via [`apps/backend/src/services/ai.factory.ts`](apps/backend/src/services/ai.factory.ts). Each provider implements the `TranslationService` interface:

```ts
interface TranslationService {
  translateText(
    text: string,
    mode: TranslationMode,
    formality: FormalityLevel
  ): Promise<TranslationResult>;
}
```

| Provider | File                  | Default model              | Notes                                                |
| -------- | --------------------- | -------------------------- | ---------------------------------------------------- |
| Groq     | `groq.service.ts`     | `llama-3.3-70b-versatile`  | Fastest; recommended. Uses the official `groq-sdk`.  |
| OpenAI   | `openai.service.ts`   | `gpt-4o-mini`              | Plain `fetch` against the chat-completions endpoint. |
| Ollama   | `ollama.service.ts`   | `llama3`                   | Local LLM. Set `OLLAMA_HOST` if not on `localhost`.  |

---

## Translation Modes & Formality

The single source of truth is [`packages/shared/src/constants.ts`](packages/shared/src/constants.ts). Both the backend validator and the frontend import from `@corpo-lingo/shared`.

### Modes

| Value           | Description                                                  |
| --------------- | ------------------------------------------------------------ |
| `email`         | Professional business email — includes greeting & sign-off. |
| `documentation` | Instructional / technical writing — direct and concise.     |
| `formal`        | Memos, presentations — neutral professional tone.            |

### Formality

| Value    | Description                                     |
| -------- | ----------------------------------------------- |
| `low`    | Light improvement, minimal wording changes.     |
| `medium` | Clearly professional, smooth phrasing.          |
| `high`   | Highly formal, structured, refined; no slang.   |

---

## Scripts Reference

### Root (`package.json`)

| Command       | What it does                                                              |
| ------------- | ------------------------------------------------------------------------- |
| `pnpm dev`    | Builds shared once, then runs backend + frontend dev servers in parallel. |
| `pnpm nx-dev` | Same but routed through Nx (`nx run-many -t dev`).                        |
| `pnpm build`  | `nx run-many -t build` — builds shared, backend, and frontend.            |
| `pnpm test`   | `nx run-many -t test` — runs all package test suites.                     |
| `pnpm lint`   | `nx run-many -t lint` — ESLint across the workspace.                      |

### Backend (`apps/backend/package.json`)

| Command      | What it does                                          |
| ------------ | ----------------------------------------------------- |
| `pnpm dev`   | `tsx watch src/server.ts` — hot-reloading dev server. |
| `pnpm build` | `tsc` — emits CommonJS to `dist/`.                    |
| `pnpm start` | `node dist/server.js` — production entrypoint.        |
| `pnpm test`  | `jest --runInBand --forceExit`.                       |

### Frontend (`apps/frontend/package.json`)

| Command        | What it does                                         |
| -------------- | ---------------------------------------------------- |
| `pnpm dev`     | Vite dev server with HMR on port 5173.               |
| `pnpm build`   | `tsc -b && vite build` → static assets in `dist/`.   |
| `pnpm preview` | Serves the prod build locally on port 4173.          |
| `pnpm lint`    | ESLint over `**/*.{ts,tsx}`.                         |

### Shared (`packages/shared/package.json`)

| Command      | What it does                                 |
| ------------ | -------------------------------------------- |
| `pnpm build` | `tsc` → `dist/index.js` + `dist/index.d.ts`. |
| `pnpm dev`   | `tsc --watch` for live updates.              |

---

## Architecture Notes

### Database schema

Two tables are created automatically by `initDb()` on backend startup:

```sql
users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
)

translations (
  id         TEXT PRIMARY KEY,       -- UUID generated by the backend
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input      TEXT NOT NULL,
  output     TEXT NOT NULL,
  mode       TEXT NOT NULL,
  formality  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

An index on `(user_id, created_at DESC)` keeps history queries fast.

### Auth flow

1. `POST /auth/register` or `/auth/login` validates credentials, hashes the password with bcrypt (cost 12), signs a 7-day JWT, and sets it as an httpOnly cookie.
2. Subsequent requests include the cookie automatically. `authenticate` middleware verifies the JWT and attaches `req.user`.
3. `optionalAuthenticate` does the same but silently ignores a missing or invalid token — used on `POST /translate` so guests can still use the app without history being saved.
4. `POST /auth/logout` calls `res.clearCookie()`.

### Why the shared package?

`@corpo-lingo/shared` ensures the frontend and backend agree on HTTP shapes and enum values at compile time. `TranslatePayload.mode` and `TranslatePayload.formality` are typed as literal unions — an invalid value is a TypeScript error at the call site, not a silent runtime bug.

### Request lifecycle

```
client → Helmet → CORS → Morgan → cookieParser → JSON body parser → rate limiter
       → /api/v1/auth route   OR   /api/v1/translate route
       → [authenticate / optionalAuthenticate]
       → validate middleware
       → controller
       → pg Pool (for auth & history)  +  ai.factory → <provider>.translateText()
       → JSON response
       (errors → next(err) → errorHandler)
```

---

## Extending the System

### Add a new AI provider

1. Create `apps/backend/src/services/myprovider.service.ts` implementing `TranslationService`.
2. Add it to the providers map in `ai.factory.ts`.
3. Set `AI_PROVIDER=myprovider` in `.env`.

### Add a new translation mode or formality level

1. Add the value to `TRANSLATION_MODES` / `FORMALITY_LEVELS` in `packages/shared/src/constants.ts`.
2. Add a corresponding description — TypeScript will enforce this.
3. Update `getModeRules` / `getFormalityRules` in `apps/backend/src/utils/promptBuilder.ts`.
4. Rebuild shared: `pnpm --filter @corpo-lingo/shared build`.

---

## Testing

```bash
# All backend tests
pnpm --filter @corpo-lingo/backend test

# With coverage
pnpm --filter @corpo-lingo/backend test -- --coverage
```

The AI factory is mocked in tests — no real LLM calls are made. There is currently no frontend test setup; `pnpm lint` is the main gate there.

---

## Production Build & Deployment

### Build manually

```bash
pnpm build
# Backend: apps/backend/dist/
# Frontend: apps/frontend/dist/
```

### Docker

```bash
docker compose up --build        # build & run all three services
docker compose up -d --build     # detached

# Single image builds (from repo root)
docker build -f apps/backend/Dockerfile  -t corpo-lingo-backend  .
docker build -f apps/frontend/Dockerfile -t corpo-lingo-frontend .
```

Both Dockerfiles are multi-stage, prune dev deps, and run `apk upgrade` to patch OS-level CVEs. The backend image runs as a non-root `appuser`.

For a single-host deployment `docker compose up -d --build` plus a reverse proxy (Caddy, Traefik, ALB, etc.) in front of port 80 is sufficient.

---

## Security

| Concern             | How it's handled                                                             |
| ------------------- | ---------------------------------------------------------------------------- |
| HTTP headers        | `helmet()` applied app-wide.                                                 |
| CORS                | Configurable allowlist via `ALLOWED_ORIGINS`.                                |
| Rate limiting       | `express-rate-limit` — 100 req / 15 min per IP on `/api/*`.                  |
| Body size           | `express.json({ limit: '10kb' })` rejects oversized payloads.                |
| Input validation    | `express-validator` enforces type, length, and enum constraints.             |
| Auth tokens         | JWT stored in httpOnly, SameSite=lax cookies — not accessible to JavaScript. |
| Password storage    | bcryptjs with cost factor 12.                                                |
| Error sanitisation  | Stacks/details only leak when `NODE_ENV === 'development'`.                  |
| Container hardening | Backend prod image runs as non-root; Alpine stages are upgraded at build.    |
| Secrets             | API keys and JWT secret live in `apps/backend/.env`, which is `.gitignore`d. |

---

## Troubleshooting

**`Cannot find module '@corpo-lingo/shared'`**
Build the shared package first: `pnpm --filter @corpo-lingo/shared build` (or `pnpm dev` from the root, which does it automatically).

**`DB connection attempt N/12 failed`**
The backend retries for up to 60 s. If it exhausts all retries, check that `DATABASE_URL` is correct and Postgres is reachable.

**`Translation service is not configured.` (HTTP 503)**
The selected provider's API key is missing. Check `AI_PROVIDER` and the corresponding `*_API_KEY` in `apps/backend/.env`.

**`EADDRINUSE: address already in use :::3000`**
```bash
lsof -i :3000
kill -9 <PID>
# or change PORT in apps/backend/.env
```

**Frontend shows CORS errors in dev**
Use relative paths (`/api/v1/...`) — that's what `translateApi.ts` and `authApi.ts` do. Hitting `http://localhost:3000` directly bypasses Vite's proxy.

**Docker frontend can't reach the backend**
Nginx proxies to `http://backend:3000` — a hostname provided by the compose network. Running the frontend image standalone requires overriding `nginx.conf`.

**Rate-limited during testing**
Restart the backend; the limiter's state is in-memory.

---
