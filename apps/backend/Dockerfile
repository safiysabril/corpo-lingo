FROM node:22-alpine AS base
RUN apk upgrade --no-cache && corepack enable && corepack prepare pnpm@9 --activate

# ── Install ALL deps (needed for tsc) ────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile

# ── Compile ───────────────────────────────────────────────────
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
# Build shared first, then backend (shared must exist before tsc resolves it)
RUN pnpm --filter @corpo-lingo/shared build
RUN pnpm --filter @corpo-lingo/backend build

# ── Production image (minimal) ────────────────────────────────
FROM base AS prod
WORKDIR /app

# Install prod-only deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output only — no source, no devDeps
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/backend/dist ./apps/backend/dist

# Run as non-root; pre-create /app/data so the volume mount is owned correctly
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && mkdir -p /app/data && chown appuser:appgroup /app/data
USER appuser

EXPOSE 3000
CMD ["node", "apps/backend/dist/server.js"]