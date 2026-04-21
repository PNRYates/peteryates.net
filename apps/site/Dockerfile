# ── build ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/site/package.json ./apps/site/package.json

RUN pnpm install --frozen-lockfile --filter site

# Copy source
COPY apps/site ./apps/site

RUN pnpm --filter site build

# ── serve ───────────────────────────────────────────────────────────────────
FROM caddy:2-alpine

COPY --from=builder /app/apps/site/dist /srv
COPY apps/site/Caddyfile /etc/caddy/Caddyfile

EXPOSE 3002
