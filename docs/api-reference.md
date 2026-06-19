# API reference

Base path: **`/api/v1`**. All responses are JSON with a `success: boolean` field.
Auth is via the **httpOnly `token` cookie** (set on register/login). Send
`credentials: 'include'` from the browser.

## Conventions

- **Success:** `{ "success": true, ... }`
- **Error:** `{ "success": false, "error": "<message>", "detail"?: "<dev only>" }`
- **Validation error (422):** `{ "success": false, "error": "Validation failed.",
  "details": [{ "field": "...", "message": "..." }] }`
- Rate limit: **100 req/day** (authenticated) / **10 req/day** (guest) on every
  `/api/` route → **429** when exceeded.

## Endpoint summary

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | none | Liveness probe (not under `/api/v1`) |
| POST | `/api/v1/auth/register` | none | Create account, set cookie |
| POST | `/api/v1/auth/login` | none | Log in, set cookie |
| POST | `/api/v1/auth/logout` | none | Clear cookie |
| GET | `/api/v1/auth/me` | required | Current user |
| POST | `/api/v1/auth/forgot-password` | none | Request reset link |
| POST | `/api/v1/auth/reset-password` | none | Set new password via token |
| GET | `/api/v1/translate/options` | none | Valid modes + formality values |
| POST | `/api/v1/translate` | optional | Translate text (guests allowed) |
| GET | `/api/v1/translate/history` | required | Last 50 translations |
| DELETE | `/api/v1/translate/history/:id` | required | Delete one translation |

---

## Health

### `GET /health`
```json
{ "success": true, "message": "Corpo Lingo API is running.",
  "timestamp": "2026-06-19T...", "version": "1.0.0" }
```

---

## Auth

### `POST /api/v1/auth/register`
Body: `{ "name": string, "email": string, "password": string (min 8) }`
- `201` → `{ "success": true, "user": { "id", "name", "email" } }` + `token` cookie
- `409` → email already in use
- `422` → validation failed

### `POST /api/v1/auth/login`
Body: `{ "email": string, "password": string }`
- `200` → `{ "success": true, "user": {...} }` + `token` cookie
- `401` → `Invalid email or password.`

### `POST /api/v1/auth/logout`
- `200` → `{ "success": true }`, clears the cookie.

### `GET /api/v1/auth/me`  *(auth required)*
- `200` → `{ "success": true, "user": { "id", "email", "name" } }`
- `401` → no / invalid cookie

### `POST /api/v1/auth/forgot-password`
Body: `{ "email": string }`
- **Always `200`** → `{ "success": true }` (whether or not the email exists — anti
  enumeration). If the user exists, a reset email is sent.

### `POST /api/v1/auth/reset-password`
Body: `{ "token": string, "password": string (min 8) }`
- `200` → `{ "success": true }`
- `400` → `This reset link is invalid or has expired.` (also if already used)

---

## Translate

### `GET /api/v1/translate/options`
```json
{ "success": true,
  "data": { "modes": ["email","documentation","formal"],
            "formality": ["low","medium","high"] } }
```

### `POST /api/v1/translate`  *(auth optional)*
Body (`TranslatePayload`):
```json
{ "text": "string (3–5000 chars)",
  "mode": "email | documentation | formal",
  "formality": "low | medium | high" }
```
`200` (`TranslateResponse`):
```json
{ "success": true,
  "data": {
    "id": "uuid",
    "original": "...",
    "translated": "...",
    "mode": "email",
    "formality": "medium"
  },
  "meta": {
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "usage": { "prompt_tokens": 0, "completion_tokens": 0 } ,
    "timestamp": "2026-06-19T..."
  } }
```
- When authenticated, the translation is saved to history (the returned `id`).
  Guests get a result but nothing is persisted.
- `422` → validation failed · `429` → rate limited · `502` → provider unavailable ·
  `503` → provider not configured (missing API key).

### `GET /api/v1/translate/history`  *(auth required)*
```json
{ "success": true,
  "data": [ { "id", "input", "output", "mode", "formality", "createdAt" } ] }
```
Returns up to **50** items, newest first.

### `DELETE /api/v1/translate/history/:id`  *(auth required)*
- `200` → `{ "success": true }`
- `404` → item not found (or not owned by the caller)

---

## Type sources

Request/response shapes are defined once in
[`packages/shared/src`](../packages/shared/src): `types.ts` (translate),
`auth.ts` (auth + history), `constants.ts` (modes + formality). Import from
`@corpo-lingo/shared` rather than re-declaring them.
