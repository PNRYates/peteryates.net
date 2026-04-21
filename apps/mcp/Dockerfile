# ── build ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/mcp/package.json ./apps/mcp/package.json

RUN pnpm install --frozen-lockfile --filter mcp

COPY apps/mcp ./apps/mcp

RUN pnpm --filter mcp build

# ── runtime ─────────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/apps/mcp/dist ./dist
COPY --from=builder /app/apps/mcp/node_modules ./node_modules

# Content directory — override CONTENT_DIR env var to point at a mounted volume
# Default: /content (mount your site's src/content here in Coolify)
ENV CONTENT_DIR=/content
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
