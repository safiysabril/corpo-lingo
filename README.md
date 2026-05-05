# Corpo Lingo

A full-stack web app that rewrites casual text into professional corporate language. Choose a **mode** (email / documentation / formal) and a **formality level** (low / medium / high), and an LLM rewrites the input accordingly.

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
│   │   │   ├── controllers/
│   │   │   │   └── translate.controller.ts
│   │   │   ├── routes/
│   │   │   │   └── translate.routes.ts
│   │   │   ├── middleware/
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
│       │   ├── pages/                  # Auth, Index, NotFound
│       │   ├── components/
│       │   │   ├── Translator.tsx      # main UI
│       │   │   └── ui/                 # shadcn-ui primitives
│       │   ├── api/translateApi.ts     # fetch wrapper
│       │   └── lib/utils.ts
│       ├── nginx.conf                  # used by the prod Docker image
│       ├── vite.config.ts
│       ├── Dockerfile
│       └── tsconfig.json
│
├── packages/
│   └── shared/                  # @corpo-lingo/shared — workspace package
│       ├── src/
│       │   ├── types.ts                # TranslatePayload, TranslateResponse
│       │   ├── constants.ts            # TRANSLATION_MODES, FORMALITY_LEVELS, …
│       │   └── index.ts                # barrel
│       └── tsconfig.json
│
├── docker-compose.yml
├── .dockerignore
├── pnpm-workspace.yaml
├── nx.json
└── package.json                 # root workspace
```

---

## Prerequisites

- **Node.js 22+** (LTS recommended)
- **pnpm 9+** — `corepack enable && corepack prepare pnpm@9 --activate`
- **Docker** (only if you want to run the production image)
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
# → open apps/backend/.env and set GROQ_API_KEY (or pick another provider)

# 3. Run everything
pnpm dev
```

`pnpm dev` (root) does two things:

1. Builds `@corpo-lingo/shared` once so the workspace can resolve its compiled output.
2. Starts the frontend and backend in parallel via pnpm filters.

You should see:

| Service  | URL                              |
| -------- | -------------------------------- |
| Frontend | http://localhost:5173            |
| Backend  | http://localhost:3000            |
| Health   | http://localhost:3000/health     |

The Vite dev server proxies `/api/*` → `http://localhost:3000`, so the frontend talks to the backend via same-origin requests during development (see [`apps/frontend/vite.config.ts`](apps/frontend/vite.config.ts)).

> ⚠️ If you edit files inside `packages/shared`, run `pnpm --filter @corpo-lingo/shared build` (or `pnpm --filter @corpo-lingo/shared dev` for watch mode) so the consumers pick up the updated `dist/`.

---

## Quick Start — Docker

The whole app ships as two production images — a Node 22 Alpine backend and an Nginx-served static frontend — orchestrated via `docker-compose.yml`.

```bash
# Build & launch both images
docker compose up --build

# Or detached
docker compose up -d --build
```

| Service  | Container Port | Host Port |
| -------- | -------------- | --------- |
| backend  | 3000           | 3000      |
| frontend | 80             | 80        |

The frontend's Nginx config proxies `/api/*` → `http://backend:3000` over the compose network, so in production the SPA and API are served from the same origin (`http://localhost`).

The backend exposes a `GET /health` endpoint that compose uses as a healthcheck; the frontend container only starts once the backend reports healthy (`depends_on.condition: service_healthy`).

To shut down:

```bash
docker compose down
```

---

## Environment Variables

The backend reads its config from `apps/backend/.env`. A template lives at `apps/backend/.env.example`.

| Variable          | Required          | Default                       | Description                                                                |
| ----------------- | ----------------- | ----------------------------- | -------------------------------------------------------------------------- |
| `PORT`            | no                | `3000`                        | Port the Express server binds to.                                          |
| `NODE_ENV`        | no                | `development`                 | When `development`, error responses include `detail` (stack/message).      |
| `AI_PROVIDER`     | no                | `openai`                      | One of `groq`, `openai`, `ollama`. Resolved per request — no restart needed. |
| `ALLOWED_ORIGINS` | no                | `*`                           | Comma-separated CORS allowlist, e.g. `http://localhost:5173,https://app.example.com`. |
| `GROQ_API_KEY`    | if `AI_PROVIDER=groq` | —                         | Groq Cloud API key.                                                        |
| `GROQ_MODEL`      | no                | `llama-3.3-70b-versatile`     | Override the Groq model.                                                   |
| `OPENAI_API_KEY`  | if `AI_PROVIDER=openai` | —                       | OpenAI API key.                                                            |
| `OPENAI_MODEL`    | no                | `gpt-4o-mini`                 | Override the OpenAI model.                                                 |
| `OLLAMA_HOST`     | no                | `http://localhost:11434`      | Base URL of a running Ollama instance.                                     |
| `OLLAMA_MODEL`    | no                | `llama3`                      | Ollama model tag to use.                                                   |

> Rate limiting is **not** env-driven; it's hardcoded in [`apps/backend/src/app.ts`](apps/backend/src/app.ts) at 100 requests per 15 minutes per IP. Adjust there if needed.

The frontend has no required env vars — its API base path is hardcoded to `/api/v1` and resolved relative to the current origin (proxied by Vite in dev, by Nginx in prod).

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

### `GET /api/v1/translate/options`

Returns the valid `mode` and `formality` values. Useful for the frontend to populate dropdowns dynamically without hard-coding strings.

**Response 200**
```json
{
  "success": true,
  "data": {
    "modes": ["email", "documentation", "formal"],
    "formality": ["low", "medium", "high"]
  }
}
```

### `POST /api/v1/translate`

Translates `text` into corporate language.

**Request body**
```json
{
  "text": "yo, can we chat about the project?",
  "mode": "email",
  "formality": "high"
}
```

**Validation rules** (see [`apps/backend/src/middleware/validate.ts`](apps/backend/src/middleware/validate.ts)):

| Field      | Rule                                                  |
| ---------- | ----------------------------------------------------- |
| `text`     | string, 3–5000 chars, required                        |
| `mode`     | one of `email`, `documentation`, `formal`             |
| `formality`| one of `low`, `medium`, `high`                        |

**Response 200**
```json
{
  "success": true,
  "data": {
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

**Error responses**

| Status | Reason                                  | Body                                                                |
| ------ | --------------------------------------- | ------------------------------------------------------------------- |
| 422    | Validation failed                       | `{ success: false, error: "Validation failed.", details: [...] }`   |
| 429    | Rate limit exceeded                     | `{ success: false, error: "Too many requests, …" }`                 |
| 502    | Upstream AI provider error              | `{ success: false, error: "Translation service is temporarily…" }`  |
| 503    | Provider misconfigured (missing API key)| `{ success: false, error: "Translation service is not configured." }` |
| 500    | Catch-all                               | `{ success: false, error: "<message>" }`                            |

---

## AI Providers

The backend resolves an AI service per request via [`apps/backend/src/services/ai.factory.ts`](apps/backend/src/services/ai.factory.ts), so changing `AI_PROVIDER` in `.env` takes effect without restarting (in dev — production processes still need an env reload).

Each provider implements the `TranslationService` interface:

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
| Ollama   | `ollama.service.ts`   | `llama3`                   | Local LLM. Set `OLLAMA_HOST` if it isn't on `localhost`. |

The temperature is derived from the formality level (lower formality → lower temperature for Groq/Ollama; the reverse for OpenAI — the heuristic is per-provider in each `getTemperature()` helper).

---

## Translation Modes & Formality

The single source of truth for these enums is [`packages/shared/src/constants.ts`](packages/shared/src/constants.ts). Both the backend validator and the frontend dropdowns import from `@corpo-lingo/shared` so the values can never drift.

### Modes

| Value           | Description                                                  |
| --------------- | ------------------------------------------------------------ |
| `email`         | Professional business email — includes greeting & sign-off. |
| `documentation` | Instructional / technical writing — direct and concise.     |
| `formal`        | Memos, presentations — neutral professional tone.            |

### Formality

| Value    | Description                                                |
| -------- | ---------------------------------------------------------- |
| `low`    | Light improvement, minimal wording changes.                |
| `medium` | Clearly professional, smooth phrasing.                     |
| `high`   | Highly formal, structured, refined; no slang.              |

The full prompt construction lives in [`apps/backend/src/utils/promptBuilder.ts`](apps/backend/src/utils/promptBuilder.ts).

---

## Scripts Reference

### Root (`package.json`)

| Command         | What it does                                                                         |
| --------------- | ------------------------------------------------------------------------------------ |
| `pnpm dev`      | Builds shared once, then runs backend + frontend dev servers in parallel.            |
| `pnpm nx-dev`   | Same but routed through Nx (`nx run-many -t dev`).                                   |
| `pnpm build`    | `nx run-many -t build` — builds shared, backend, and frontend.                       |
| `pnpm test`     | `nx run-many -t test` — runs all package test suites.                                |
| `pnpm lint`     | `nx run-many -t lint` — ESLint across the workspace.                                 |

### Backend (`apps/backend/package.json`)

| Command         | What it does                                          |
| --------------- | ----------------------------------------------------- |
| `pnpm dev`      | `tsx watch src/server.ts` — hot-reloading dev server. |
| `pnpm build`    | `tsc` — emits CommonJS to `dist/`.                    |
| `pnpm start`    | `node dist/server.js` — production entrypoint.        |
| `pnpm test`     | `jest --runInBand --forceExit`.                       |

### Frontend (`apps/frontend/package.json`)

| Command         | What it does                                          |
| --------------- | ----------------------------------------------------- |
| `pnpm dev`      | Vite dev server with HMR on port 5173.                |
| `pnpm build`    | `tsc -b && vite build` → static assets in `dist/`.    |
| `pnpm preview`  | Serves the prod build locally on port 4173.           |
| `pnpm lint`     | ESLint over `**/*.{ts,tsx}`.                          |

### Shared (`packages/shared/package.json`)

| Command         | What it does                                          |
| --------------- | ----------------------------------------------------- |
| `pnpm build`    | `tsc` → `dist/index.js` + `dist/index.d.ts`.          |
| `pnpm dev`      | `tsc --watch` for live updates.                       |

---

## Architecture Notes

### Why the shared package?

Both the frontend and backend need to agree on:

- The HTTP request/response shapes (`TranslatePayload`, `TranslateResponse`).
- The set of valid modes and formality levels.

Hard-coding those strings in two places is the classic place where a typo silently breaks production. `@corpo-lingo/shared` is a workspace-linked package whose compiled output (`dist/`) is consumed via `import { … } from '@corpo-lingo/shared'`. Both `TranslatePayload.mode` and `TranslatePayload.formality` are typed as the `TranslationMode` / `FormalityLevel` literal unions, so an invalid value is a TypeScript error at the call site.

### Module formats

- `packages/shared` compiles with `module: node16`, output is CommonJS-compatible (no `"type": "module"` in its `package.json`).
- `apps/backend` compiles with `module: commonjs` and consumes the shared package via standard `require`/`import` interop.
- `apps/frontend` is bundled by Vite, which doesn't care about the module format.

### Provider factory pattern

[`ai.factory.ts`](apps/backend/src/services/ai.factory.ts) holds a `Record<string, TranslationService>` populated by static imports. Each provider lazily initialises its underlying client (e.g. the Groq SDK is only constructed on first call), so the cost of having all three loaded is negligible.

### Request lifecycle

```
client → Helmet → CORS → Morgan → JSON body parser → rate limiter
       → /api/v1/translate route
       → validate middleware (express-validator)
       → translate.controller
       → ai.factory.getTranslationService()
       → <provider>.translateText()
       → JSON response
       (errors → next(err) → errorHandler)
```

---

## Extending the System

### Add a new AI provider

1. Create `apps/backend/src/services/myprovider.service.ts` that exports `default { translateText } satisfies TranslationService`.
2. Add it to the providers map in `ai.factory.ts`:
   ```ts
   import myprovider from './myprovider.service';
   const providers = { groq, openai, ollama, myprovider };
   ```
3. Set `AI_PROVIDER=myprovider` in `.env` (and any required keys).
4. No frontend or shared-types changes needed.

### Add a new translation mode (or formality level)

1. Add the new value to `TRANSLATION_MODES` (or `FORMALITY_LEVELS`) in `packages/shared/src/constants.ts`.
2. Add a corresponding entry to `MODE_DESCRIPTIONS` (or `FORMALITY_DESCRIPTIONS`) — TypeScript will force you to.
3. Update the prompt rules in `apps/backend/src/utils/promptBuilder.ts` (`getModeRules` / `getFormalityRules`).
4. Rebuild shared: `pnpm --filter @corpo-lingo/shared build`.
5. The frontend dropdowns and the backend validator pick up the new value automatically.

---

## Testing

The backend has a Jest + Supertest suite under `apps/backend/tests/`. The AI factory is mocked, so tests never touch a real LLM.

```bash
# All backend tests
pnpm --filter @corpo-lingo/backend test

# With coverage
pnpm --filter @corpo-lingo/backend test -- --coverage
```

There's currently no frontend test setup — `pnpm lint` is the main gate there.

---

## Production Build & Deployment

### Build the bundles manually

```bash
pnpm build                    # builds shared, backend, and frontend

# Backend output: apps/backend/dist/
# Frontend output: apps/frontend/dist/   (static files for any CDN / Nginx)
```

### Build the production Docker images

The repo includes two **multi-stage Dockerfiles** that prune dev dependencies and produce minimal final images:

- `apps/backend/Dockerfile` — Node 22 Alpine, runs as a non-root `appuser`, executes `node apps/backend/dist/server.js`.
- `apps/frontend/Dockerfile` — Vite static build copied into `nginx:alpine`, served on port 80.

Both stages run `apk upgrade --no-cache` to patch known OS-level CVEs at build time.

```bash
# Build & run together (recommended)
docker compose up --build

# Build a single image
docker build -f apps/backend/Dockerfile -t corpo-lingo-backend .
docker build -f apps/frontend/Dockerfile -t corpo-lingo-frontend .
```

The compose file:
- Mounts `apps/backend/.env` into the backend container.
- Defines a healthcheck on `GET /health`.
- Makes the frontend wait until the backend is healthy before starting Nginx.

For a single-host deployment, `docker compose up -d --build` plus a reverse proxy (Caddy, Traefik, ALB, etc.) in front of port 80 is enough. For Kubernetes, the same images work — wire them into a Deployment + Service per app and reuse the healthcheck path as the readiness probe.

---

## Security

| Concern             | How it's handled                                                       |
| ------------------- | ---------------------------------------------------------------------- |
| HTTP headers        | `helmet()` applied app-wide.                                           |
| CORS                | Configurable allowlist via `ALLOWED_ORIGINS`.                          |
| Rate limiting       | `express-rate-limit` — 100 req / 15 min per IP on `/api/*`.            |
| Body size           | `express.json({ limit: '10kb' })` rejects oversized payloads.          |
| Input validation    | `express-validator` enforces type, length, and enum constraints.       |
| Error sanitisation  | Stacks/details only leak when `NODE_ENV === 'development'`.            |
| Container hardening | Backend prod image runs as non-root; both Alpine stages are upgraded.  |
| Secrets             | API keys live in `apps/backend/.env`, which is `.gitignore`d.          |

---

## Troubleshooting

**`Cannot find module '@corpo-lingo/shared'`**
You haven't built the shared package yet. Run `pnpm --filter @corpo-lingo/shared build` (or just `pnpm dev` from the root, which does it for you).

**`Translation service is not configured.` (HTTP 503)**
The selected provider's API key is missing. Check `AI_PROVIDER` and the corresponding `*_API_KEY` in `apps/backend/.env`.

**`EADDRINUSE: address already in use :::3000`**
```bash
lsof -i :3000
kill -9 <PID>
# or change PORT in apps/backend/.env
```

**Frontend shows CORS errors in dev**
You're probably hitting the backend directly (`http://localhost:3000`) instead of going through Vite's proxy. Use relative paths (`/api/v1/...`) — that's what `translateApi.ts` does.

**Docker frontend can't reach the backend**
The Nginx config inside the container proxies to `http://backend:3000` — that hostname is provided by Docker Compose's network. If you run the frontend image standalone, you'll need to override `nginx.conf` or expose the backend differently.

**Rate-limited during testing**
Restart the backend; the limiter's state is in-memory.

---

## License

UNLICENSED — private project.
