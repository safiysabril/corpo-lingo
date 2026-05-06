FROM node:22-alpine AS base
RUN apk upgrade --no-cache && corepack enable && corepack prepare pnpm@9 --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend
RUN pnpm --filter @corpo-lingo/shared build
RUN pnpm --filter @corpo-lingo/frontend build

# Vite output is static — serve with nginx, no Node needed
FROM nginx:alpine AS prod
RUN apk upgrade --no-cache && apk add --no-cache gettext
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf.template /etc/nginx/conf.d/nginx.conf.template
EXPOSE 80
CMD ["/bin/sh", "-c", "export NAMESERVER=$(awk '/^nameserver/{ns=$2; if(ns~/:/)ns=\"[\"ns\"]\"; print ns; exit}' /etc/resolv.conf) && envsubst '${BACKEND_HOST} ${NAMESERVER}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]