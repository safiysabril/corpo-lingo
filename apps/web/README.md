# @corpo-lingo/web — new (Lovable) frontend

This is the **new frontend**, added as a *second app* alongside the existing
[`apps/frontend`](../frontend). Paste your Lovable-generated code here, test it
against the real backend, then delete `apps/frontend` once you're happy.

It's pre-wired for this monorepo: a `/api` dev proxy to the backend, the
`@corpo-lingo/shared` alias, and a dedicated dev port so both frontends can run at
once.

## Run it

```bash
# just this app  → http://localhost:5174
pnpm --filter @corpo-lingo/web dev

# everything (backend + both frontends), needs a DB running — see docs/local-development.md
pnpm dev
```

The Lovable app uses **mock data**, so it runs standalone — you don't need the
backend up until you wire the real API (Phase 2).

## Stack

Vite 5 · React 18 · TypeScript · Tailwind CSS **v3** · shadcn/ui — matches Lovable's
output (deliberately *not* the Tailwind v4 setup `apps/frontend` uses, so pasted
Lovable code works unchanged).

---

## Phase 1 — paste the design in

> **Keep these files — they hold the monorepo wiring. Do NOT overwrite them with
> Lovable's versions:**
> `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`,
> `package.json`.

### Don't hand-copy `src/components/ui/*` — generate them

Those are stock shadcn/ui primitives. They were installed in one shot with the
shadcn CLI (48 components + `use-toast`/`use-mobile` hooks):

```bash
pnpm dlx shadcn@latest add accordion alert alert-dialog aspect-ratio avatar badge \
  breadcrumb button calendar card carousel chart checkbox collapsible command \
  context-menu dialog drawer dropdown-menu form hover-card input input-otp label \
  menubar navigation-menu pagination popover progress radio-group resizable \
  scroll-area select separator sheet sidebar skeleton slider sonner switch table \
  tabs textarea toast toggle toggle-group tooltip \
  --yes --overwrite --cwd apps/web
```

Need just one later? `pnpm dlx shadcn@latest add <name> --cwd apps/web`.

> ⚠️ The CLI rewrites `index.css` + `tailwind.config.ts` with default tokens. Paste
> your Lovable theme **after** running it (or back the two files up and restore
> them), then keep them as the source of truth.

### Copy these **from Lovable** by hand (your actual app code)

| Order | From Lovable | Into | Notes |
|------:|--------------|------|-------|
| 1 | `src/index.css` | `src/index.css` | Your theme tokens/colors/fonts |
| 2 | `tailwind.config.ts` | `tailwind.config.ts` | Your custom theme/animations |
| 3 | `public/**` | `public/` | Favicon, images, etc. |
| 4 | `src/lib/**` + custom `src/hooks/**` | same paths | Helpers first (skip the shadcn-generated hooks) |
| 5 | `src/components/*` (NON-`ui/`) | same paths | Your bespoke components only |
| 6 | `src/pages/**` | same paths | Screens |
| 7 | `src/App.tsx`, `src/main.tsx` | same paths | Last — wires routes/providers together |

After each batch: `pnpm --filter @corpo-lingo/web dev` and check http://localhost:5174.

### Missing dependency while pasting?

`package.json` already ships the standard Lovable/shadcn dependency set. If a pasted
file imports something not installed, add it:

```bash
pnpm --filter @corpo-lingo/web add <package>
```

---

## Phase 2 — swap mock data for the real API

The plumbing is ready (`/api` is proxied to `http://localhost:3000`; cookies flow
because it's same-origin). To go live:

1. Copy the API client from the old app:
   [`apps/frontend/src/api/translateApi.ts`](../frontend/src/api/translateApi.ts)
   and [`authApi.ts`](../frontend/src/api/authApi.ts) into `apps/web/src/api/`.
2. Replace your Lovable mock calls with those functions.
3. Import shared types/constants from **`@corpo-lingo/shared`**
   (`TranslationMode`, `FORMALITY_LEVELS`, `TranslatePayload`, …) instead of
   redefining them — that keeps the UI and API in lockstep.
4. Keep `credentials: 'include'` on every request (httpOnly `token` cookie auth) and
   always call relative `/api/v1/...` paths.

See [docs/api-reference.md](../../docs/api-reference.md) for exact payloads and
[docs/frontend.md](../../docs/frontend.md) for how the current app uses TanStack
Query + the `useAuth` hook.

---

## Phase 3 — promote and retire the old app

When you've verified everything:

1. Add a `Dockerfile` + `nginx.conf.template` (copy `apps/frontend`'s, swap the
   `--filter` name) and a `web` service in `docker-compose.yml`.
2. Add it to `.github/workflows/deploy.yml` if you want CI images.
3. Delete `apps/frontend/`, and (optionally) rename this app to `@corpo-lingo/frontend`.

> Ask Claude to do Phase 2/3 — it can wire the API, Docker, and compose for you.
