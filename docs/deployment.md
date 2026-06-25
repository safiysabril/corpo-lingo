# Deployment

## Two Compose files

| File | Purpose |
|------|---------|
| [`docker-compose.yml`](../docker-compose.yml) | **Full stack** — postgres + redis + backend + frontend. Runs in **development mode** for local testing (see the `NODE_ENV` note below), not as-is in production. |
| [`docker-compose.dev.yml`](../docker-compose.dev.yml) | **Infra only** — postgres + redis with host ports, for `pnpm dev`. See [local-development.md](local-development.md). |

## Full stack with Docker

```bash
docker compose up --build          # foreground
docker compose up -d --build       # detached
docker compose down                # stop
docker compose down -v             # stop + wipe the postgres volume
```

Services and ports:

| Service | Container port | Host port | Notes |
|---------|----------------|-----------|-------|
| postgres | 5432 | — | internal only (no host mapping) |
| redis | 6379 | — | internal only |
| backend | 3000 | 3000 | `DATABASE_URL`/`REDIS_URL` injected by Compose |
| frontend | 80 | 80 | Nginx serves the SPA + proxies `/api` → backend |

Key wiring:
- The backend service uses `env_file: apps/backend/.env` **and** overrides
  `DATABASE_URL`/`REDIS_URL` via `environment:` to point at the `postgres`/`redis`
  service names. So your local `.env` DB settings don't affect the Dockerized run.
- **`NODE_ENV` defaults to `development`** here (`NODE_ENV: ${NODE_ENV:-development}`,
  also the value in `.env`). That means **no `Secure` cookies, the JWT startup guard
  off, and DB SSL disabled** — correct for local `http://localhost`, but *not*
  production. Don't just flip it to `production` in this compose: `Secure` cookies
  aren't sent over plain HTTP (login breaks) and the backend would attempt SSL against
  the non-TLS local postgres (connection fails). A real deployment runs with
  `NODE_ENV=production` behind HTTPS and an SSL-capable managed Postgres.
- The frontend container reads `BACKEND_HOST=backend:3000` and templates it into
  `nginx.conf` at startup (`envsubst`), so Nginx proxies `/api/*` to the backend.

## Images

Both Dockerfiles are **multi-stage** and produce lean images:

- **Backend** ([`apps/backend/Dockerfile`](../apps/backend/Dockerfile)) — builds with
  full deps (`tsc`), then a `--prod` install + compiled `dist/` only. Runs as a
  non-root `appuser`. `CMD node apps/backend/dist/server.js`.
- **Frontend** ([`apps/frontend/Dockerfile`](../apps/frontend/Dockerfile)) — builds
  the Vite bundle, then serves it from `nginx:alpine`. No Node in the final image.

Both run `apk upgrade` to patch the base image.

## CI/CD

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) builds and pushes
both images to **GitHub Container Registry (GHCR)** on every push to `master`
(skipped for `**.md`-only changes):

- `ghcr.io/<owner>/corpo-lingo-backend:latest`
- `ghcr.io/<owner>/corpo-lingo-frontend:latest`

It builds and pushes images only — it does not deploy them to a host. Wire up your
platform (Railway, a VPS, etc.) to pull these tags.

## Environment variables

Set in `apps/backend/.env` (copy from `.env.example`). The frontend talks to a
relative `/api`, so the only frontend var is `VITE_GOOGLE_CLIENT_ID` — a **public**
value inlined into the bundle at build time (see "Frontend build arg" below). It is
optional; leave it unset to disable the Google button.

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DATABASE_URL` | **yes** | — | PostgreSQL connection string |
| `JWT_SECRET` | **yes (prod)** | `dev-secret-change-in-production` | Signs JWTs — change it |
| `PORT` | no | `3000` | Backend port |
| `NODE_ENV` | no | `development` | `production` enables cookie `Secure`, DB SSL, hides error detail |
| `REDIS_URL` | no | — | Enables translation caching; skipped if unset |
| `AI_PROVIDER` | no | `openai`* | `groq` \| `openai` \| `gemini` \| `ollama` |
| `FALLBACK_PROVIDER` | no | — | Provider to try on a 429 |
| `GROQ_API_KEY` / `GROQ_MODEL` | if groq | — / `llama-3.3-70b-versatile` | Groq creds + model |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | if openai | — / `gpt-4o-mini` | OpenAI creds + model |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | if gemini | — / `gemini-2.0-flash` | Gemini creds + model |
| `OLLAMA_HOST` / `OLLAMA_MODEL` | if ollama | `http://localhost:11434` / `llama3.2` | Ollama endpoint + model |
| `ALLOWED_ORIGINS` | no | `http://localhost:5173` | Comma-separated CORS allowlist |
| `APP_URL` | no | `http://localhost:5173` | Base URL in password-reset links |
| `RESEND_API_KEY` | no | — | Resend HTTP API key for reset emails (HTTPS, Railway-friendly) |
| `EMAIL_FROM` | no | `Corpo Lingo <noreply@corpolingo.app>` | From address for reset emails |
| `GOOGLE_CLIENT_ID` | no | — | Google OAuth Web client ID (public). Enables Google sign-in |
| `GOOGLE_CLIENT_SECRET` | no | — | Google OAuth client secret — **backend only, never sent to the browser** |

\* The repo's `.env.example` ships `AI_PROVIDER=groq`. The code's fallback default is
`openai` only if the var is entirely unset.

### Frontend build arg (`VITE_GOOGLE_CLIENT_ID`)

`VITE_*` vars are inlined by Vite at **build time**, so the frontend image needs the
public Google client ID passed as a Docker build arg — it is not read at runtime:

- **docker-compose:** `frontend.build.args.VITE_GOOGLE_CLIENT_ID` reads
  `${VITE_GOOGLE_CLIENT_ID}` from your shell or a root `.env`.
- **CI** (`.github/workflows/deploy.yml`): passed from the `VITE_GOOGLE_CLIENT_ID`
  GitHub Actions repository **variable** (not a secret — it's public).

Use the same value as the backend's `GOOGLE_CLIENT_ID`. Leave it unset to ship
without the Google button. Add your frontend origin(s) to the OAuth client's
**Authorized JavaScript origins** in Google Cloud Console (e.g. `http://localhost`
for the Docker frontend on port 80, `http://localhost:5173` for `pnpm dev`).

### Production checklist

- [ ] Strong, unique `JWT_SECRET`.
- [ ] `NODE_ENV=production` (cookies become `Secure`; serve over HTTPS).
- [ ] Real `DATABASE_URL` (managed Postgres). DB SSL is enabled automatically in prod.
- [ ] `REDIS_URL` set (recommended — saves AI calls and latency).
- [ ] A valid AI provider key + `AI_PROVIDER`.
- [ ] `ALLOWED_ORIGINS` set to your real frontend origin(s).
- [ ] `RESEND_API_KEY` + verified `EMAIL_FROM` domain for password reset.
- [ ] For Google sign-in: `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` on the backend,
      `VITE_GOOGLE_CLIENT_ID` build arg on the frontend, and your prod origin added to
      the OAuth client's Authorized JavaScript origins.
- [ ] Terminate TLS at a reverse proxy in front of the frontend (port 80).

## Build without Docker

```bash
pnpm --filter @corpo-lingo/shared build
pnpm --filter @corpo-lingo/backend build     # → apps/backend/dist
pnpm --filter @corpo-lingo/frontend build     # → apps/frontend/dist
# or all at once via Nx:
pnpm build
node apps/backend/dist/server.js              # run the compiled backend
```
