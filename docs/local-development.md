# Local development

## TL;DR — why `pnpm dev` failed but `docker compose up` works

`docker compose up` works because the [`docker-compose.yml`](../docker-compose.yml)
**spins up Postgres and Redis containers** and injects `DATABASE_URL` /
`REDIS_URL` into the backend. Everything the backend needs exists inside the
Compose network.

`pnpm dev` runs the apps **directly on your host** — it does **not** start a
database. So the backend booted with:

- **No `DATABASE_URL`** → `pg` tried to connect with an undefined password →
  `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`, retrying
  12× then exiting. The server never came up.
- **No Redis** on `localhost:6379` → repeated `[cache] Redis error` log spam
  (non-fatal — caching is just skipped).

There was also a real code bug surfaced only in dev: `express-rate-limit` v8 throws
`ERR_ERL_KEY_GEN_IPV6` because the guest key generator used `req.ip` directly. This
is now fixed in [`apps/backend/src/app.ts`](../apps/backend/src/app.ts) using the
`ipKeyGenerator()` helper. (Docker hid it less, but the real difference was the
database.)

**The fix:** give `pnpm dev` a database to talk to, and make sure `DATABASE_URL`
points at it. Two ways below.

---

## Prerequisites

- **Node.js 22+**
- **pnpm 9+** — `corepack enable && corepack prepare pnpm@9 --activate`
- A **PostgreSQL** instance (see options below)
- *(optional)* **Redis** for translation caching
- An **AI provider key** (Groq has a generous free tier — recommended)

## First-time setup

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env   # then fill in your AI key + JWT_SECRET
```

`apps/backend/.env.example` ships with a working default
`DATABASE_URL=postgresql://corpo:corpo@localhost:5432/corpo_lingo` that matches
Option A below.

---

## Option A (recommended): throwaway Postgres + Redis via Docker

Use [`docker-compose.dev.yml`](../docker-compose.dev.yml) — it runs **only** Postgres
and Redis and exposes their ports to your host, so the host-run backend can reach
them. App code still runs via `pnpm dev` with hot reload.

```bash
docker compose -f docker-compose.dev.yml up -d   # start db + redis
pnpm dev                                          # run backend + frontend on the host
```

The Compose credentials match the default `DATABASE_URL`, so no extra config is
needed. To stop / reset:

```bash
docker compose -f docker-compose.dev.yml down      # stop, keep data
docker compose -f docker-compose.dev.yml down -v   # stop and wipe the database
```

> **Port 5432 already in use?** If you run a **native Postgres service** (e.g.
> `systemctl status postgresql`), it already owns `5432` and the Compose Postgres
> can't bind. Either stop the native service, use Option B instead, or change the
> host port in `docker-compose.dev.yml` (e.g. `"5433:5432"`) and update
> `DATABASE_URL` to `...@localhost:5433/...`.

> **Docker needs sudo?** If your user isn't in the `docker` group, prefix commands
> with `sudo` (or add yourself: `sudo usermod -aG docker $USER`, then re-login).

## Option B: use a Postgres you already run

If you already have a local Postgres (e.g. a system service on `5432`), create the
role and database the app expects instead of running the Docker one:

```bash
# Connect as a superuser (Fedora/RHEL native install):
sudo -u postgres psql

-- then, in psql:
CREATE ROLE corpo WITH LOGIN PASSWORD 'corpo';
CREATE DATABASE corpo_lingo OWNER corpo;
\q
```

The default `DATABASE_URL` then works as-is. Prefer different credentials or an
existing database? Just point `DATABASE_URL` at it — the backend creates its tables
automatically on boot via `initDb()`.

Redis is optional in this setup. To run the app **without** Redis and silence the
`[cache] Redis error` logs, comment out `REDIS_URL` in `apps/backend/.env`
(caching is skipped, every translate hits the AI provider).

---

## What `pnpm dev` actually does

From the root [`package.json`](../package.json):

```jsonc
"dev": "pnpm --filter @corpo-lingo/shared build && pnpm run --parallel dev"
```

1. Builds `@corpo-lingo/shared` once (so the apps see current types).
2. Runs every package's `dev` script in parallel:
   - `apps/backend` → `tsx watch src/server.ts` (hot reload)
   - `apps/frontend` → `vite` (HMR)
   - `packages/shared` → `tsc --watch` (rebuilds types on change)

URLs once running:

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:3000 |
| Health check | http://localhost:3000/health |

The Vite dev server proxies `/api/*` to `http://localhost:3000`
(see [`vite.config.ts`](../apps/frontend/vite.config.ts)), so always call the API
via relative `/api/v1/...` paths — never hit `:3000` directly from the browser.

### Running one app at a time

```bash
pnpm --filter @corpo-lingo/backend dev
pnpm --filter @corpo-lingo/frontend dev
pnpm --filter @corpo-lingo/shared build   # rebuild after editing shared
```

---

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| `client password must be a string` | `DATABASE_URL` is unset. It's now in `.env.example`; make sure your `.env` has it. |
| `password authentication failed for user "corpo"` | The `corpo` role/db doesn't exist in the Postgres you're hitting. Use Option A (Docker) or create it (Option B). |
| `DB connection attempt N/12 failed` | No reachable Postgres. Start one (Option A/B) before `pnpm dev`. |
| `[cache] Redis error` (repeating) | No Redis at `REDIS_URL`. Start it (Option A) or comment out `REDIS_URL`. |
| `ERR_ERL_KEY_GEN_IPV6` | Fixed in `app.ts`. If you still see it, rebuild: `pnpm --filter @corpo-lingo/backend build`. |
| `Cannot find module '@corpo-lingo/shared'` | Rebuild shared: `pnpm --filter @corpo-lingo/shared build`. |
| `Translation service is not configured` (503) | Missing/blank AI provider key. Set `GROQ_API_KEY` (or your chosen provider's key) in `.env`. |
| Port already in use | `lsof -i :3000` / `:5173`, kill the process, or change `PORT`. |
