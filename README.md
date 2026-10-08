# peteryates.net

Personal site and blog. Monorepo with two apps:

| App | Path | Description |
|-----|------|-------------|
| `site` | `apps/site` | Astro static site, served by Caddy |
| `mcp` | `apps/mcp` | MCP server for AI tooling access to content |

## Stack

- **Site:** Astro 6, Tailwind v4, MDX, Shiki, KaTeX, satori for OG images
- **MCP:** Node 22, `@modelcontextprotocol/sdk`, Express, Streamable HTTP (plus legacy SSE)
- **Deploy:** Docker (multi-stage), Caddy, Coolify

## Local dev

**Prerequisites:** Node 22.12+, pnpm 9+

```bash
# Install deps (run from repo root)
pnpm install

# Run the site in dev mode (localhost:4321)
pnpm dev

# Run the MCP server in dev mode (localhost:3001)
cp .env.example .env          # fill in MCP_AUTH_TOKEN
pnpm dev:mcp

# Build both apps
pnpm build
pnpm build:mcp
```

## Content

Content lives in `apps/site/src/content/` as markdown (`.md`) and MDX (`.mdx`) files.

```
apps/site/src/content/
├── posts/        # Blog posts
├── projects/     # Project list
├── photography/  # Gallery links
├── pages/        # Homepage and About page
└── settings/     # Site name, navigation, social links
```

Add a new post by creating a file in `posts/` with the required frontmatter:

```md
---
title: "My post"
description: "Short description"
publishedAt: 2024-06-01
tags: ["tag"]
draft: false
---

Post body here.
```

Draft posts (`draft: true`) are visible in dev mode but excluded from production builds.

### Content editor

Run the site locally with `pnpm dev`, then open
`http://localhost:4321/keystatic` to manage posts, projects, photography, the
homepage, the About page, and global site settings through the Keystatic editor.
The editor writes directly to the Markdown files in this repository, so review
and commit those changes normally.

The editor is intentionally available only in local development. Production
remains a static site and does not expose an admin route.

## MCP server

The MCP server reads the same content from the filesystem. In development it reads
from `../../site/src/content` relative to `apps/mcp/`. In production (Docker) it reads
from wherever `CONTENT_DIR` points — by default `/content`, which `Dockerfile.mcp`
bakes into the image at build time. Redeploy the MCP service to pick up new content,
or mount a volume at `CONTENT_DIR` instead.

### Endpoints

| Path | Description |
|------|-------------|
| `POST /mcp` | Streamable HTTP transport (stateless) — use this for new clients |
| `GET /sse`, `POST /messages` | Legacy HTTP+SSE transport |
| `GET /health` | Health check |

### Available tools

| Tool | Description |
|------|-------------|
| `list_posts` | List posts, filter by tag/limit/includeDrafts |
| `get_post` | Get full post by slug (drafts only with `includeDrafts`) |
| `list_projects` | List projects, filter by status |
| `list_photography` | List photography galleries, newest first |
| `get_about` | Get the About page |
| `search_content` | Full-text search across posts, projects, photography, and About |

### Auth

All MCP endpoints require `Authorization: Bearer <MCP_AUTH_TOKEN>`. Set this in
your `.env` file (or Coolify env vars). The `/health` endpoint is unauthenticated.

## Coolify setup

Two services, one repo. Create them both pointing at this repository.

### Service 1 — Site

| Setting | Value |
|---------|-------|
| Build context | `/` (repo root) |
| Dockerfile path | `apps/site/Dockerfile` |
| Port | `3002` |
| Domain | `peteryates.net` |

No environment variables required for the site.

### Service 2 — MCP server

| Setting | Value |
|---------|-------|
| Build context | `/` (repo root) |
| Dockerfile path | `Dockerfile.mcp` |
| Port | `3001` |
| Domain | `mcp.peteryates.net` (or internal only) |

Environment variables:

| Variable | Description |
|----------|-------------|
| `MCP_AUTH_TOKEN` | Long random string, required |
| `CONTENT_DIR` | Path to content directory inside container |
| `PORT` | Port to listen on (default: `3001`) |

Content is baked into the MCP image, so redeploy it after content changes. To
avoid rebuilds, mount a volume containing `apps/site/src/content/` and point
`CONTENT_DIR` at it.

## Architectural notes

- **No React islands.** The site is pure Astro components. React is only imported
  as a peer dependency for satori's OG image generation.
- **Tailwind v4** uses the Vite plugin (`@tailwindcss/vite`) rather than
  `@astrojs/tailwind`, which targets v3.
- **Analytics** is Umami, injected in `src/layouts/Base.astro` for production
  builds with the website ID hardcoded there. `data-domains` limits
  tracking to the production hostname, so previews and local builds don't count.
  Custom events: `post-read` (50%/100% depth), `outbound-link` (links in post
  bodies), `footnote-preview`, `gallery-click`, `project-click`, `social-click`,
  `rss-click`, `theme-toggle`. Track from scripts with `window.umami?.track()`
  inline; don't put it in a shared module, since a chunk named `analytics.*.js`
  gets blocked by ad blockers and takes the importing scripts down with it.
- **Draft filtering** happens at collection load time via `getCollection` filter.
  No special build flag needed; `import.meta.env.DEV` handles it.
