# Corpo Lingo — Documentation

Reference docs for the Corpo Lingo monorepo. Start here, then jump to the area you need.

| Doc | What's inside |
|-----|---------------|
| [architecture.md](architecture.md) | High-level system design, the request lifecycle, and how the pieces fit together |
| [local-development.md](local-development.md) | How to run the stack locally, **why `pnpm dev` needs a database**, and troubleshooting |
| [backend.md](backend.md) | Express API internals: routing, middleware, controllers, services, caching, DB |
| [frontend.md](frontend.md) | React SPA internals: pages, components, hooks, API layer, state management |
| [api-reference.md](api-reference.md) | Every endpoint with request/response shapes, auth, and status codes |
| [database.md](database.md) | Schema, tables, indexes, and how migrations (don't) work |
| [ai-providers.md](ai-providers.md) | The pluggable provider system, prompt building, fallback, and adding a provider |
| [deployment.md](deployment.md) | Docker images, docker-compose, CI/CD, and environment variables |

## What is Corpo Lingo?

A **corporate language translator**. A user pastes casual text, picks a **mode**
(`email` / `documentation` / `formal`) and a **formality level** (`low` / `medium` /
`high`), and an LLM rewrites it into polished professional language. It supports
guest use, optional accounts with saved translation history, password reset, and
voice input.

## The one-paragraph mental model

It's a **pnpm + Nx monorepo** with three packages: an Express 5 backend
(`apps/backend`), a React 19 + Vite SPA (`apps/frontend`), and a shared types
package (`packages/shared`) imported by both. The backend exposes a REST API under
`/api/v1`, talks to a swappable AI provider (Groq by default), caches results in
Redis, and persists users + history in Postgres. The frontend is a static SPA that
proxies `/api/*` to the backend (Vite in dev, Nginx in Docker).

> **Editing `packages/shared`?** Rebuild it (`pnpm --filter @corpo-lingo/shared build`)
> or the backend/frontend won't see the new types. `pnpm dev` does this build once on
> startup.
