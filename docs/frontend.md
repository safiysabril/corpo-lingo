# Frontend (`apps/frontend`)

React 19 + Vite 5 single-page app. TypeScript, Tailwind CSS v3, shadcn/ui
(Radix-based) components, TanStack Query for server state, React Router 6 for
routing, and `next-themes` for light/dark mode.

## Entry + providers

- [`src/main.tsx`](../apps/frontend/src/main.tsx) — mounts `<App />` into `#root`.
- [`src/App.tsx`](../apps/frontend/src/App.tsx) — wraps the router in a
  `next-themes` `ThemeProvider` (`attribute="class"`, `defaultTheme="system"`),
  `QueryClientProvider` (TanStack Query), `TooltipProvider`, and two toasters
  (`<Toaster />` + sonner `<Sonner />`). Defines routes.

## Routes

| Path | Page | Notes |
|------|------|-------|
| `/` | [`pages/Index.tsx`](../apps/frontend/src/pages/Index.tsx) | Renders `<Translator />` — the main app |
| `/auth` | [`pages/Auth.tsx`](../apps/frontend/src/pages/Auth.tsx) | Login / register tabs; Google sign-in; "Forgot password?" link |
| `/forgot-password` | [`pages/ForgotPassword.tsx`](../apps/frontend/src/pages/ForgotPassword.tsx) | Request a reset link |
| `/reset-password` | [`pages/ResetPassword.tsx`](../apps/frontend/src/pages/ResetPassword.tsx) | Set a new password via `?token=` |
| `*` | [`pages/NotFound.tsx`](../apps/frontend/src/pages/NotFound.tsx) | 404 |

## Main component: `Translator.tsx`

[`src/components/Translator.tsx`](../apps/frontend/src/components/Translator.tsx) is
the whole translator UI in one component:

- **Input panel** — textarea, mode selector (Email / Docs / Formal) and formality
  selector (Subtle / Moderate / Maximum). Mode maps to the shared `TranslationMode`
  (`email | documentation | formal`); formality maps to `FormalityLevel`
  (`low | medium | high`).
- **Output panel** — translated result with copy-to-clipboard; prompts guests to
  sign in to save.
- **History tile** — only for authenticated users; a flat list of the last 50
  translations (click to reload, delete per item). Rendered by
  [`History.tsx`](../apps/frontend/src/components/History.tsx).
- **Theme toggle** — [`ThemeToggle.tsx`](../apps/frontend/src/components/ThemeToggle.tsx)
  in the brand tile flips light/dark via `next-themes` (`useTheme`).

Mode/formality values come from `@corpo-lingo/shared` constants, so the UI can never
send an invalid value to the API.

## State management

- **Server state → TanStack Query.** No Redux/Zustand.
- Auth is derived from `GET /api/v1/auth/me` via the
  [`useAuth`](../apps/frontend/src/hooks/useAuth.ts) hook. `getMe()` returns `null` on
  401, so "logged out" is a normal state, not an error.
- `useLogout()` calls the logout endpoint, then clears the auth + `['history']`
  query caches.
- History is a query keyed `['history']`, `enabled` only when the user is signed in;
  invalidated after translate/delete (the backend auto-saves on translate, so the
  client just refetches).

## Theming (light + dark)

- `next-themes` drives a `class` strategy: it toggles `.dark` on `<html>`, persists
  the choice to `localStorage`, and respects `prefers-color-scheme` by default. A
  no-flash inline script is injected automatically.
- Color tokens are CSS variables (HSL) defined for `:root` (light) and `.dark` in
  [`src/index.css`](../apps/frontend/src/index.css) — the "Warm Sand" palette.
- `tailwind.config.ts` sets `darkMode: ["class"]` and maps the CSS variables to
  Tailwind color names.

## Google sign-in (Authorization Code flow)

- [`GoogleSignInButton.tsx`](../apps/frontend/src/components/GoogleSignInButton.tsx)
  uses Google Identity Services (`google.accounts.oauth2.initCodeClient`, popup
  `ux_mode`) to obtain a short-lived **authorization code**, then calls back with it.
- [`Auth.tsx`](../apps/frontend/src/pages/Auth.tsx) posts that code to the backend via
  `googleLogin(code)`; the backend exchanges it for tokens with the hidden client
  secret and sets the session cookie.
- Gated on `VITE_GOOGLE_CLIENT_ID` (public client ID, inlined at build time). If
  unset, the button is hidden. See [docs/deployment.md](deployment.md) for env wiring.

## Hooks

- [`useAuth.ts`](../apps/frontend/src/hooks/useAuth.ts) — `useAuth()` + `useLogout()`.
- [`use-mobile.tsx`](../apps/frontend/src/hooks/use-mobile.tsx) — `useIsMobile()`
  media-query helper (shadcn).
- [`use-toast.ts`](../apps/frontend/src/hooks/use-toast.ts) — toast state (shadcn).

## API layer (`src/api/`)

All calls use `fetch` with `credentials: 'include'` so the httpOnly `token` cookie
rides along. Base path is `/api/v1`.

- [`translateApi.ts`](../apps/frontend/src/api/translateApi.ts) — `translateText()`.
- [`authApi.ts`](../apps/frontend/src/api/authApi.ts) — `register`, `login`,
  `logout`, `googleLogin`, `getMe`, `getHistory`, `deleteHistoryItem`,
  `forgotPassword`, `resetPassword`. A shared `request()` helper guards against
  non-JSON responses (e.g. an HTML error page) and throws a friendly message.

## Build & dev

| Command | Effect |
|---------|--------|
| `pnpm --filter @corpo-lingo/frontend dev` | Vite dev server + HMR on :5173 |
| `pnpm --filter @corpo-lingo/frontend build` | `vite build` → `dist/` |
| `pnpm --filter @corpo-lingo/frontend preview` | Serve the production build locally |
| `pnpm --filter @corpo-lingo/frontend lint` | ESLint |

### Path aliases ([`vite.config.ts`](../apps/frontend/vite.config.ts))

- `@` → `apps/frontend/src`
- `@corpo-lingo/shared` → `packages/shared/src/index.ts` (resolved straight to
  source in dev, so shared edits hot-reload without a rebuild on the frontend).

### Dev proxy

Vite proxies `/api/*` → `http://localhost:3000` (backend). In Docker, Nginx does the
same (see [`nginx.conf.template`](../apps/frontend/nginx.conf.template)). Always use
relative `/api/v1/...` URLs.

## Styling

- **Tailwind CSS v3** with PostCSS + Autoprefixer (`tailwind.config.ts` +
  `postcss.config.js`). Theme tokens are CSS variables in `src/index.css`.
- **shadcn/ui** components in `src/components/ui/`, managed with the shadcn CLI
  (config in [`components.json`](../apps/frontend/components.json)). Add more with
  `pnpm dlx shadcn@latest add <component>`.
- Fonts: **Instrument Serif** (headings, `.font-serif`) + **Work Sans** (body),
  loaded via Google Fonts `@import` at the top of `src/index.css`.
</content>
</invoke>
