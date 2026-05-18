# Corpo Lingo

A full-stack web app that rewrites casual text into professional corporate language. Choose a **mode** (email / documentation / formal) and a **formality level** (low / medium / high). An LLM rewrites your text accordingly. Supports authentication, translation history, and multiple AI backends.

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
│   ├── backend/     # Express API server
│   │   ├── src/
│   │   │   ├── app.ts
│   │   │   ├── server.ts
│   │   │   ├── db/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── tsconfig.json
│   └── frontend/    # React + Vite SPA
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── pages/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── api/
│       ├── index.html
│       ├── vite.config.ts
│       ├── Dockerfile
│       └── tsconfig.json
├── packages/
│   └── shared/      # @corpo-lingo/shared — universal types & constants
│       ├── src/
│       │   ├── types.ts
│       │   ├── auth.ts
│       │   ├── constants.ts
│       │   └── index.ts
│       └── tsconfig.json
├── docker-compose.yml
├── pnpm-workspace.yaml
├── nx.json
└── package.json
```

---

## Prerequisites

- **Node.js 22+** (LTS recommended)
- **pnpm 9+** — `corepack enable && corepack prepare pnpm@9 --activate`
- **PostgreSQL 16+** (local dev), or use Docker containers
- **Docker** (optional; runs DB/backend/frontend via Compose)
- **AI provider API key** (Groq recommended — generous free tier)

---

## Quick Start — Local Development

```bash
# 1. Clone & install
git clone <repo-url>
cd corpo-lingo
pnpm install

# 2. Configure backend
cp apps/backend/.env.example apps/backend/.env
#  — Fill in: DATABASE_URL, JWT_SECRET, your AI provider key

# 3. Run everything
pnpm dev
```

- `pnpm dev` does a one-off build of `@corpo-lingo/shared`, then concurrently starts frontend & backend.
- Backend auto-creates tables for users & translations on first start (`initDb`).
- Frontend dev server proxies `/api/*` to backend for local smoothness.

Frontend: http://localhost:5173  
Backend:  http://localhost:3000  
Health:   http://localhost:3000/health

*If you change `packages/shared`, re-run its build with `pnpm --filter @corpo-lingo/shared build`.*

---

## Quick Start — Docker

Three services: Postgres, backend (Node 22), frontend (Nginx-served static SPA). Managed with `docker-compose.yml`.

```bash
docker compose up --build
# or
docker compose up -d --build
```

| Service  | Container | Host  |
|----------|-----------|-------|
| postgres | 5432      | —     |
| backend  | 3000      | 3000  |
| frontend | 80        | 80    |

- DB is accessible only inside the compose network.
- Nginx proxies `/api/*` to backend.

To clear your dev database data:

```bash
docker compose down -v
```

---

## Environment Variables

Defined in `apps/backend/.env` (see `.env.example`).

| Variable          | Required                | Default                          | Desc                                           |
|-------------------|------------------------|-----------------------------------|------------------------------------------------|
| DATABASE_URL      | yes                    | —                                 | PostgreSQL connection string                   |
| JWT_SECRET        | yes (prod)             | dev-secret-change-in-production   | For JWT tokens; **change in prod**             |
| PORT              | no                     | 3000                              | Express server port                            |
| NODE_ENV          | no                     | development                       | Shows error stacks when 'development'          |
| AI_PROVIDER       | no                     | openai                            | 'groq', 'openai', or 'ollama'                  |
| ALLOWED_ORIGINS   | no                     | http://localhost:5173             | CORS allowlist                                 |
| GROQ_API_KEY      | if groq                | —                                 | Groq Cloud API key                             |
| GROQ_MODEL        | no                     | llama-3.3-70b-versatile           | Groq model override                            |
| OPENAI_API_KEY    | if openai              | —                                 | OpenAI API key                                 |
| OPENAI_MODEL      | no                     | gpt-4o-mini                       | OpenAI model override                          |
| OLLAMA_HOST       | no                     | http://localhost:11434            | Ollama server base URL                         |
| OLLAMA_MODEL      | no                     | llama3                            | Ollama model tag                               |

- The frontend needs no env vars for dev/prod.
- Rate limit: 100 requests/15min/IP (see `apps/backend/src/app.ts`).

---

## API Reference

Base path: `/api/v1`

**Liveness:** `GET /health`  
Returns health, timestamp, and API version.

### Auth routes (`/api/v1/auth`)
- `POST /register`: `{name, email, password}` → set `token` cookie
- `POST /login`: `{email, password}` → set `token` cookie
- `POST /logout`: clears `token` cookie
- `GET /me`: Returns current user (requires cookie auth)

### Translate routes (`/api/v1/translate`)
- `GET /options`: Valid values for `mode` & `formality`
- `POST /`: `{text, mode, formality}` → translation (guest or logged-in); logged-in users' queries saved to history
- `GET /history`: Last 50 translations for current user
- `DELETE /history/:id`: Delete translation by id (owned by user)

**For detailed request/response shapes:** see the [full API section above or Swagger (if available)]. Most types and validation rules are enforced server-side and shared via `@corpo-lingo/shared`.

---

## AI Providers

**Pluggable AI provider via `AI_PROVIDER` env.**  
- `groq` (default; fastest)
- `openai`
- `ollama` (local LLM)

Switch providers by updating `.env`. Each implements the `TranslationService` interface:

```ts
translateText(
  text: string,
  mode: TranslationMode,
  formality: FormalityLevel
): Promise<TranslationResult>
```

Backend resolves provider per-request using [`apps/backend/src/services/ai.factory.ts`](apps/backend/src/services/ai.factory.ts).

---

## Translation Modes & Formality

Source of truth: [`packages/shared/src/constants.ts`](packages/shared/src/constants.ts)

### Modes

| Value           | Description                                                  |
|-----------------|-------------------------------------------------------------|
| `email`         | Business email (greeting, sign-off, subject)                |
| `documentation` | Instructional/technical writing                             |
| `formal`        | Memos, presentations, or highly polished correspondence     |

### Formality

| Value    | Description                                  |
|----------|----------------------------------------------|
| `low`    | Light copy-edit, minimal changes             |
| `medium` | Clearly professional, smooth tone            |
| `high`   | Highly formal; no slang, very refined wording|

---

## Scripts Reference

### Root (`package.json`)

| Command       | Description                                                        |
|---------------|--------------------------------------------------------------------|
| `pnpm dev`    | Build shared, run backend & frontend dev servers                   |
| `pnpm nx-dev` | Same, but via Nx                                                   |
| `pnpm build`  | Nx build all (shared, backend, frontend)                           |
| `pnpm test`   | Nx run all test suites                                             |
| `pnpm lint`   | Nx lint all codebases                                              |

### Backend (`apps/backend/package.json`)

| Command      | Description                                    |
|--------------|------------------------------------------------|
| `pnpm dev`   | Hot-reload backend via tsx                     |
| `pnpm build` | Compile backend                                |
| `pnpm start` | Run production backend                         |
| `pnpm test`  | Jest tests                                     |

### Frontend (`apps/frontend/package.json`)

| Command        | Description                                   |
|----------------|-----------------------------------------------|
| `pnpm dev`     | Vite dev server (+HMR)                        |
| `pnpm build`   | TypeScript + Vite build (assets in `dist/`)   |
| `pnpm preview` | Preview Vite build locally                    |
| `pnpm lint`    | ESLint checks                                 |

### Shared (`packages/shared/package.json`)

| Command      | Description                                 |
|--------------|---------------------------------------------|
| `pnpm build` | TypeScript build (types/constants)           |
| `pnpm dev`   | TSC watch for hot type updates               |

---

## Architecture Notes

### Database schema

Auto-created by `initDb()` if not present:

```sql
users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
)

translations (
  id         TEXT PRIMARY KEY,      -- UUID
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input      TEXT NOT NULL,
  output     TEXT NOT NULL,
  mode       TEXT NOT NULL,
  formality  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

Index: `(user_id, created_at DESC)` for fast history.

### Auth flow

1. Register or login — validator, bcrypt hash, JWT (7 days) set as `httpOnly` cookie.
2. Every request includes cookie; backend validates JWT.
3. `optionalAuthenticate` applied on POST `/translate` for guest/non-guest support.
4. Logout clears the cookie.

### Shared package usage

Frontend & backend share types and constants (esp. enums for mode/formality) for single-source-of-truth API and UI validation.

---

## Extending the System

**Add an AI provider:**  
1. Add a file in `apps/backend/src/services/` implementing `TranslationService`
2. Register it in `ai.factory.ts`
3. Set `AI_PROVIDER` in backend env

**Add translation mode or formality:**  
1. Add in `packages/shared/src/constants.ts`
2. Adjust descriptions and prompt rules as needed
3. Rebuild shared package

---

## Testing

**Backend:**  
```bash
pnpm --filter @corpo-lingo/backend test
# For coverage:
pnpm --filter @corpo-lingo/backend test -- --coverage
```

- All LLM calls are mocked.  
- No frontend tests yet; run `pnpm lint` for code sanity.

---

## Production Build & Deployment

Build artifacts (`dist/`) for backend & frontend with:

```bash
pnpm build
```

**Docker deployment:**  
`docker compose up -d --build` (runs all services)  
Both backend & frontend Dockerfiles are multi-stage, prune dev dependencies, and patch Alpine OS on build. Backend image runs as non-root.

Put a reverse proxy (Caddy/Traefik etc.) in front of port 80 for HTTPS.

---

## Security

| Concern             | Approach                                                               |
|---------------------|-----------------------------------------------------------------------|
| HTTP headers        | `helmet()` everywhere                                                 |
| CORS                | Allowlist via `ALLOWED_ORIGINS` env                                   |
| Rate limiting       | `express-rate-limit` middleware                                       |
| Body size           | `express.json({ limit: '10kb' })`                                     |
| Input validation    | `express-validator` enforces types/enums/ranges                       |
| Auth tokens         | JWT in httpOnly & SameSite=lax cookies only                           |
| Password storage    | bcryptjs, cost=12                                                     |
| Error sanitization  | Stacks shown only in non-production                                   |
| Container hardening | Backend production container runs non-root; aggressive dependency pruning|
| Secrets             | Never checked in; `.env` is gitignored                                |

---

## Troubleshooting

**`Cannot find module '@corpo-lingo/shared'`**  
Rebuild shared: `pnpm --filter @corpo-lingo/shared build`

**`DB connection attempt N/12 failed`**  
Confirm `DATABASE_URL` and Postgres connectivity.

**`Translation service is not configured` (503)**  
Check provider key(s) in backend env.

**Port already in use**  
Run `lsof -i :3000` and `kill -9 <PID>` if necessary — or change `PORT`.

**Frontend CORS or proxy issues**  
Always use relative `/api/v1/...` endpoints; do not call backend directly on port 3000 from browser (dev proxy is configured).

**Docker networking**  
Frontend and backend containers talk directly over Docker network, not localhost.

**Rate-limited during testing**  
Restart backend; limiter is in-memory.

---
