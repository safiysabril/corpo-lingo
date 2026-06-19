# Frontend (`apps/frontend`)

React 19 + Vite 8 single-page app. TypeScript, Tailwind CSS v4, shadcn/ui
(Radix-based) components, TanStack Query for server state, React Router 7 for
routing.

## Entry + providers

- [`src/main.tsx`](../apps/frontend/src/main.tsx) — mounts `<App />` into `#root`.
- [`src/App.tsx`](../apps/frontend/src/App.tsx) — wraps the router in
  `QueryClientProvider` (TanStack Query), `TooltipProvider`, and a `<Toaster />`
  (sonner). Defines routes.

## Routes

| Path | Page | Notes |
|------|------|-------|
| `/` | [`pages/Index.tsx`](../apps/frontend/src/pages/Index.tsx) | Renders `<Translator />` — the main app |
| `/auth` | [`pages/Auth.tsx`](../apps/frontend/src/pages/Auth.tsx) | Login / register tabs; "Forgot password?" link |
| `/forgot-password` | [`pages/ForgotPassword.tsx`](../apps/frontend/src/pages/ForgotPassword.tsx) | Request a reset link |
| `/reset-password` | [`pages/ResetPassword.tsx`](../apps/frontend/src/pages/ResetPassword.tsx) | Set a new password via `?token=` |
| `/translate` | → redirect to `/` | Kept for backward compatibility |
| `*` | [`pages/NotFound.tsx`](../apps/frontend/src/pages/NotFound.tsx) | 404 |

## Main component: `Translator.tsx`

[`src/components/Translator.tsx`](../apps/frontend/src/components/Translator.tsx) is
the whole translator UI in one component:

- **Input panel** — textarea, mode selector (Email / Docs / Formal), formality
  selector (Subtle / Moderate / Maximum), and a **mic button** for voice input.
- **Output panel** — translated result with copy-to-clipboard; prompts guests to
  sign in to save.
- **History sidebar** — only for authenticated users; lists the last 50
  translations, click to reload, delete per item. Collapsible on mobile.
- **Dark mode** — toggled via a `theme` value in `localStorage` + the `dark` class
  on `<html>`; initial value also respects `prefers-color-scheme`.

Mode/formality values come from `@corpo-lingo/shared` constants, so the UI can never
send an invalid value to the API.

## State management

- **Server state → TanStack Query.** No Redux/Zustand.
- Auth is derived from `GET /api/v1/auth/me` via the
  [`useAuth`](../apps/frontend/src/hooks/useAuth.ts) hook (query key
  `['auth','me']`, `retry: false`, 5-min `staleTime`). `getMe()` returns `null` on
  401, so "logged out" is a normal state, not an error.
- `useLogout()` calls the logout endpoint, then clears the `['auth','me']` and
  `['history']` query caches.
- History is a query keyed `['history']`, `enabled` only when `authUser` exists;
  invalidated after translate/delete.

## Hooks

- [`useAuth.ts`](../apps/frontend/src/hooks/useAuth.ts) — `useAuth()` + `useLogout()`.
- [`useSpeechRecognition.ts`](../apps/frontend/src/hooks/useSpeechRecognition.ts) —
  wraps the Web Speech API (`SpeechRecognition`). Exposes `isListening`,
  `isSupported`, `startListening`, `stopListening`; appends transcripts to the input.

## API layer (`src/api/`)

All calls use `fetch` with `credentials: 'include'` so the httpOnly `token` cookie
rides along. Base path is `/api/v1`.

- [`translateApi.ts`](../apps/frontend/src/api/translateApi.ts) — `translateText()`.
- [`authApi.ts`](../apps/frontend/src/api/authApi.ts) — `register`, `login`,
  `logout`, `getMe`, `getHistory`, `deleteHistoryItem`, `forgotPassword`,
  `resetPassword`. A shared `request()` helper guards against non-JSON responses
  (e.g. an HTML error page) and throws a friendly message.

## Build & dev

| Command | Effect |
|---------|--------|
| `pnpm --filter @corpo-lingo/frontend dev` | Vite dev server + HMR on :5173 |
| `pnpm --filter @corpo-lingo/frontend build` | `tsc -b && vite build` → `dist/` |
| `pnpm --filter @corpo-lingo/frontend preview` | Serve the production build locally |
| `pnpm --filter @corpo-lingo/frontend lint` | ESLint |

### Path aliases ([`vite.config.ts`](../apps/frontend/src/../vite.config.ts))

- `@` → `apps/frontend/src`
- `@corpo-lingo/shared` → `packages/shared/src/index.ts` (resolved straight to
  source in dev, so shared edits hot-reload without a rebuild on the frontend).

### Dev proxy

Vite proxies `/api/*` → `http://localhost:3000` (backend). In Docker, Nginx does the
same (see [`nginx.conf.template`](../apps/frontend/nginx.conf.template)). Always use
relative `/api/v1/...` URLs.

## Styling

- **Tailwind CSS v4** via `@tailwindcss/vite` (no `tailwind.config.js` — config is
  CSS-first in `src/index.css`).
- **shadcn/ui** components in `src/components/ui/` (`button`, `card`, `tooltip`,
  `sonner`). Config in [`components.json`](../apps/frontend/components.json).
- Geist variable font via `@fontsource-variable/geist`.
