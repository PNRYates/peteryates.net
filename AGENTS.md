# Agent Notes

## Project Overview

- This is a private pnpm monorepo for `peteryates.net`.
- `apps/site` is the Astro static site.
- `apps/mcp` is the MCP server that exposes site content to AI tooling.
- Content lives in `apps/site/src/content/`.

## Local Commands

- Check pnpm: `pnpm --version`
- Install dependencies from the repo root: `pnpm install`
- Run the site dev server: `pnpm --filter site dev`
- The site dev server uses `localhost:4321`.
- Run the MCP dev server: `pnpm --filter mcp dev`
- Build the site: `pnpm --filter site build`
- Build the MCP server: `pnpm --filter mcp build`

## Notes From Previous Agent Config

- The old `.claude/launch.json` launched the `site` app with:
  `pnpm --filter site dev` on port `4321`.
- The old `.claude/settings.local.json` allowed checking the pnpm version and
  running npm installs. Prefer pnpm for this repository because the lockfile and
  root `packageManager` are pnpm-based.

## Working Style

- Follow existing Astro, TypeScript, and Tailwind v4 patterns.
- Keep content changes in the existing Markdown/MDX frontmatter style.
- When importing documents with citations, preserve them as native Markdown
  footnotes (`[^1]` references with matching `[^1]:` definitions); do not use
  Unicode superscript markers plus a manually numbered notes list.
- Do not replace pnpm lockfile or package-manager metadata with npm or yarn
  equivalents.
