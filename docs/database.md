# Database

PostgreSQL, accessed via `pg.Pool` in
[`apps/backend/src/db/index.ts`](../apps/backend/src/db/index.ts). Connection comes
from `DATABASE_URL`.

## No migration framework

Schema is created at **boot** by `initDb()` using `CREATE TABLE IF NOT EXISTS`. There
is no `migrations/` folder and no migration tool. Consequences:

- To change the schema, edit the `CREATE TABLE` / `CREATE INDEX` statements in
  `initDb()`. New tables/indexes are picked up automatically on next boot.
- **`IF NOT EXISTS` does not alter existing tables.** Adding a column to a table that
  already exists requires a manual `ALTER TABLE` (write a one-off script or run SQL
  by hand) — `initDb()` won't do it for you.
- `initDb()` retries the connection 12× with a 5s delay, which is what lets the
  backend wait for Postgres to become healthy in Docker.

## Tables

### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `SERIAL` | PK |
| `name` | `TEXT` | not null |
| `email` | `TEXT` | not null, **unique** |
| `password_hash` | `TEXT` | bcrypt, cost 12 |
| `created_at` | `TIMESTAMPTZ` | default `NOW()` |

### `translations`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `TEXT` | PK — a UUID generated in the controller |
| `user_id` | `INTEGER` | FK → `users(id)` `ON DELETE CASCADE` |
| `input` | `TEXT` | original text |
| `output` | `TEXT` | translated text |
| `mode` | `TEXT` | `email` / `documentation` / `formal` |
| `formality` | `TEXT` | `low` / `medium` / `high` |
| `created_at` | `TIMESTAMPTZ` | default `NOW()` |

Index: `idx_translations_user_id` on `(user_id, created_at DESC)` — powers the
history query (latest 50 per user).

> Only **authenticated** users' translations are stored. Guest translations are
> never written here.

### `password_reset_tokens`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `SERIAL` | PK |
| `user_id` | `INTEGER` | FK → `users(id)` `ON DELETE CASCADE` |
| `token_hash` | `TEXT` | **SHA-256 of the raw token**, unique |
| `expires_at` | `TIMESTAMPTZ` | 1 hour after creation |
| `used_at` | `TIMESTAMPTZ` | set when consumed (enforces single use) |
| `created_at` | `TIMESTAMPTZ` | default `NOW()` |

Index: `idx_prt_hash` on `token_hash`.

**Security:** the raw reset token is never stored — only its SHA-256 hash. The
plaintext token exists only inside the reset URL emailed to the user. On
`forgot-password`, any prior **unused** tokens for that user are deleted first.

## Inspecting the dev database

With the Docker dev infra running (`docker compose -f docker-compose.dev.yml up -d`):

```bash
docker compose -f docker-compose.dev.yml exec postgres \
  psql -U corpo -d corpo_lingo -c '\dt'        # list tables
docker compose -f docker-compose.dev.yml exec postgres \
  psql -U corpo -d corpo_lingo -c 'SELECT id, email FROM users;'
```

Or with a native client against the default URL:

```bash
psql postgresql://corpo:corpo@localhost:5432/corpo_lingo
```

## Resetting data

```bash
docker compose -f docker-compose.dev.yml down -v   # drop the dev volume entirely
```
Tables are recreated empty on the next backend boot.
