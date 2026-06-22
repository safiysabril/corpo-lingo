# @corpo-lingo/frontend

The Corpo Lingo web UI — a React 19 + Vite 5 single-page app. Paste casual text, pick
a mode and formality level, and get back polished corporate language. Guests can
translate freely; signing in (email/password or Google) adds saved history. Includes
light/dark mode and password reset.

For the full architecture (routes, state, theming, API layer), see
[docs/frontend.md](../../docs/frontend.md).

## Stack

React 19 · Vite 5 · TypeScript · Tailwind CSS v3 · shadcn/ui (Radix) · TanStack
Query · React Router 6 · `next-themes`.

## Develop

The backend must be running (the dev server proxies `/api/*` to `http://localhost:3000`).
From the repo root:

```bash
docker compose -f docker-compose.dev.yml up -d   # Postgres + Redis
pnpm --filter @corpo-lingo/backend dev           # backend on :3000
pnpm --filter @corpo-lingo/frontend dev          # this app on :5173
```

Or `pnpm dev` from the root to run everything at once.

## Scripts

| Command | Effect |
|---------|--------|
| `pnpm --filter @corpo-lingo/frontend dev` | Vite dev server + HMR on :5173 |
| `pnpm --filter @corpo-lingo/frontend build` | Production build → `dist/` |
| `pnpm --filter @corpo-lingo/frontend preview` | Serve the production build locally |
| `pnpm --filter @corpo-lingo/frontend lint` | ESLint |

## UI components (shadcn/ui)

Components live in `src/components/ui/` and are managed with the shadcn CLI
(config in `components.json`). Add more with:

```bash
pnpm dlx shadcn@latest add <component> --cwd apps/frontend
```

## Environment

One optional, **build-time**, public var enables Google sign-in:

```bash
cp .env.example .env          # then set VITE_GOOGLE_CLIENT_ID
```

`VITE_GOOGLE_CLIENT_ID` must match the backend's `GOOGLE_CLIENT_ID`; leave it blank to
hide the Google button. Because Vite inlines `VITE_*` at build time, Docker/CI pass it
as a build arg — see
[docs/deployment.md](../../docs/deployment.md#frontend-build-arg-vite_google_client_id).

## Build wiring (don't overwrite)

`vite.config.ts` carries the monorepo glue — keep the `@corpo-lingo/shared` source
alias, the `/api` dev proxy, and the dev port. In Docker the app is built to static
files and served by Nginx (`Dockerfile` + `nginx.conf.template`), which proxies
`/api/*` to the backend via the `BACKEND_HOST` env var.
