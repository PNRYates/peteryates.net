# peteryates.net

Personal site and blog. Monorepo with two apps:

| App | Path | Description |
|-----|------|-------------|
| `site` | `apps/site` | Astro static site, served by Caddy |
| `mcp` | `apps/mcp` | MCP server for AI tooling access to content |

## Stack

- **Site:** Astro 5, Tailwind v4, MDX, Shiki, KaTeX, satori for OG images
- **MCP:** Node 20, `@modelcontextprotocol/sdk`, Express, HTTP/SSE transport
- **Deploy:** Docker (multi-stage), Caddy, Coolify

## Local dev

**Prerequisites:** Node 20+, pnpm 9+

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
└── resources/    # Curated links
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

The MCP server reads the same content at runtime. In development it reads from
`../../site/src/content` relative to `apps/mcp/`. In production (Docker) it reads
from wherever `CONTENT_DIR` points — by default `/content`.

**Content volume decision:** The MCP reads content from the filesystem at runtime
(not baked into the image at build time). This means you can update content without
rebuilding the MCP image — only the site image needs rebuilding. In Coolify, both
services mount the same volume.

### Available tools

| Tool | Description |
|------|-------------|
| `list_posts` | List posts, filter by tag/limit/includeDrafts |
| `get_post` | Get full post by slug |
| `list_projects` | List projects, filter by status |
| `list_resources` | List resources, filter by category |
| `search_content` | Full-text search across all content |

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
| Port | `80` |
| Domain | `peteryates.net` |

No environment variables required for the site.

### Service 2 — MCP server

| Setting | Value |
|---------|-------|
| Build context | `/` (repo root) |
| Dockerfile path | `apps/mcp/Dockerfile` |
| Port | `3001` |
| Domain | `mcp.peteryates.net` (or internal only) |

Environment variables:

| Variable | Description |
|----------|-------------|
| `MCP_AUTH_TOKEN` | Long random string, required |
| `CONTENT_DIR` | Path to content directory inside container |
| `PORT` | Port to listen on (default: `3001`) |

**Shared content volume:** Create a volume in Coolify and mount it at `/content`
in both services. Copy your `apps/site/src/content/` into the volume on first
deploy. When you add new content, update the volume and trigger a redeploy of
the MCP service (the site always rebuilds from source).

Alternatively, bake the content into the MCP image by copying it during the
Docker build — simpler if you're the only author and don't mind rebuilding the
MCP image on each content change.

## Architectural notes

- **No React islands.** The site is pure Astro components. React is only imported
  as a peer dependency for satori's OG image generation.
- **Tailwind v4** uses the Vite plugin (`@tailwindcss/vite`) rather than
  `@astrojs/tailwind`, which targets v3.
- **Analytics placeholder** is noted in `src/pages/index.astro` — add your script
  tag there.
- **Draft filtering** happens at collection load time via `getCollection` filter.
  No special build flag needed; `import.meta.env.DEV` handles it.
