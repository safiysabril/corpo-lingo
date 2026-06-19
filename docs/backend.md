# Backend (`apps/backend`)

Express 5 + TypeScript REST API. Compiled with `tsc` to CommonJS in `dist/`; run in
dev with `tsx watch`.

## Boot sequence

[`src/server.ts`](../apps/backend/src/server.ts):

1. `import 'dotenv/config'` — load `.env`.
2. `await initDb()` — connect to Postgres and create tables if missing (retries 12×,
   5s apart). **Blocks startup until Postgres is reachable.**
3. `app.listen(PORT)` — start Express (default port `3000`).
4. Registers `SIGTERM` (graceful shutdown) and `unhandledRejection` handlers.

The Express app itself is built in [`src/app.ts`](../apps/backend/src/app.ts) and
exported without listening, which keeps it importable by Supertest in tests.

## Directory map

```
src/
├── server.ts              entry point (env, initDb, listen)
├── app.ts                 Express app: middleware stack, rate limiter, routes
├── controllers/
│   ├── translate.controller.ts   translate, getOptions, getHistory, deleteHistoryItem
│   └── auth.controller.ts        register, login, logout, me, forgot/resetPassword
├── routes/
│   ├── translate.routes.ts
│   └── auth.routes.ts
├── middleware/
│   ├── authenticate.ts    authenticate (required) + optionalAuthenticate (guest-ok)
│   ├── validate.ts        validateTranslation (express-validator chain)
│   ├── errorHandler.ts    central error → JSON mapper
│   └── notFound.ts        404 JSON for unknown routes
├── services/
│   ├── ai.factory.ts      provider selection + translateWithFallback
│   ├── groq.service.ts    default provider
│   ├── openai.service.ts
│   ├── gemini.service.ts
│   ├── ollama.service.ts
│   ├── email.service.ts   Resend / Ethereal password-reset email
│   └── types.ts           TranslationService + TranslationResult interfaces
├── utils/
│   ├── cache.ts           Redis get/set + SHA-256 cache key
│   └── promptBuilder.ts   system + user prompt construction
├── db/
│   └── index.ts           pg Pool + initDb() schema bootstrap
└── scripts/
    └── generateDataset.ts dev-only dataset generator (inputs.json)
```

## Middleware stack (order matters)

From `app.ts`, applied in this order:

1. `app.set('trust proxy', 1)` — trust the first proxy hop (Nginx/load balancer) so
   `req.ip` is the real client IP.
2. `helmet()` — security headers.
3. `cors({ origin: ALLOWED_ORIGINS, credentials: true })` — cookie-bearing
   cross-origin requests from the allowlist.
4. `morgan('dev')` — request logging.
5. `cookieParser()` — parse the `token` cookie.
6. `express.json({ limit: '10kb' })` + `urlencoded`.
7. **Rate limiter** on `/api/`.
8. Routes: `/health`, `/api/v1/auth`, `/api/v1/translate`.
9. `notFound` then `errorHandler` (must be last).

## Rate limiting

```ts
const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,                         // 1 day
  limit: (req) => (getAuthUserId(req) !== null ? 100 : 10),
  keyGenerator: (req) => {
    const userId = getAuthUserId(req);
    return userId !== null ? `user:${userId}` : `guest:${ipKeyGenerator(req.ip ?? '')}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);
```

- `getAuthUserId()` verifies the JWT cookie directly (independent of route
  middleware) to decide **both** the limit and the key.
- **100/day** authenticated, **10/day** guests.
- `ipKeyGenerator()` (from `express-rate-limit`) normalises IPv6 addresses to a
  subnet. Using `req.ip` raw throws `ERR_ERL_KEY_GEN_IPV6` in v8 — that was the
  `pnpm dev` crash. Keep the helper.
- The store is **in-memory** — counters reset on restart and aren't shared across
  multiple backend instances.

## Controllers

### `translate.controller.ts`
- `translate` — cache lookup → `translateWithFallback` on miss → cache set →
  persist to `translations` only when `req.user` exists **and** the user row still
  exists. Responds with `data.id` (a fresh UUID) + `meta` (provider, model, usage).
- `getOptions` — returns the valid `modes` and `formality` values from shared
  constants. Powers the UI's selectors.
- `getHistory` — last **50** translations for the user, newest first.
- `deleteHistoryItem` — deletes by `id` scoped to `user_id` (404 if not owned).

### `auth.controller.ts`
- `register` — 409 if email taken, else bcrypt-hash + insert + set cookie (201).
- `login` — verify bcrypt hash, set cookie (200). Generic 401 on bad credentials.
- `logout` — clears the cookie.
- `me` — echoes the authenticated user from the JWT.
- `forgotPassword` — **always returns 200** (prevents email enumeration). On a real
  user: deletes prior unused tokens, stores a new SHA-256 token hash (1h TTL), emails
  the reset link.
- `resetPassword` — validates the token hash (unused + unexpired), updates the
  password, marks the token used (single-use).

## Services

See [ai-providers.md](ai-providers.md) for the AI provider system and prompt
building.

**Email** ([`email.service.ts`](../apps/backend/src/services/email.service.ts)) picks
a transport at send time:
1. `RESEND_API_KEY` set → **Resend HTTP API** (HTTPS 443, works on Railway).
2. Non-production with no key → **Ethereal** disposable inbox; preview URL logged.
3. Production with no key → skip send, log the reset URL as a warning.

## Caching ([`utils/cache.ts`](../apps/backend/src/utils/cache.ts))

- Redis via `ioredis`, created only if `REDIS_URL` is set (otherwise a no-op).
- Key = `SHA-256(text|mode|formality)`; TTL = **30 days**.
- All cache calls are wrapped in try/catch — a Redis outage degrades to "no cache",
  never an error to the client.

## Database ([`db/index.ts`](../apps/backend/src/db/index.ts))

- `pg.Pool` from `DATABASE_URL`. `ssl: { rejectUnauthorized: false }` in production.
- `initDb()` runs `CREATE TABLE IF NOT EXISTS` for all three tables on boot. There
  is **no migration framework** — schema changes go in `initDb()`. See
  [database.md](database.md).

## Error handling ([`middleware/errorHandler.ts`](../apps/backend/src/middleware/errorHandler.ts))

Central handler maps thrown errors to JSON:
- Message contains `OpenAI` → **502** "temporarily unavailable".
- Message contains `API key` → **503** "not configured".
- Else → `err.statusCode`/`err.status` or **500**.
- Stack traces / details included only when `NODE_ENV === 'development'`.

## Testing

`tests/` uses **Jest + Supertest**, in-band (`--runInBand --forceExit`). Each test
file mocks the AI layer with `jest.mock('../src/services/ai.factory', ...)` so no
real key is needed. The **database is not mocked** — tests that exercise DB queries
must mock `pool` from `src/db/index.ts`. Run:

```bash
pnpm --filter @corpo-lingo/backend test
pnpm --filter @corpo-lingo/backend test -- --testPathPattern=translate
```
