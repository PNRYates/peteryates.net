import { createHash, timingSafeEqual } from 'crypto';
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { z } from 'zod';
import { getPage, getPhotography, getPosts, getProjects, searchContent } from './content.js';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const AUTH_TOKEN = process.env['MCP_AUTH_TOKEN'];

// ── MCP server ──────────────────────────────────────────────────────────────

// A McpServer can only be connected to one transport, so each session gets its own.
function createServer(): McpServer {
  const mcp = new McpServer({ name: 'blog-mcp', version: '0.1.0' });

  mcp.tool(
    'list_posts',
    'List blog posts with optional filters',
    {
      tag: z.string().optional().describe('Filter by tag'),
      limit: z.number().int().positive().optional().describe('Maximum number of results'),
      includeDrafts: z.boolean().optional().describe('Include draft posts'),
    },
    async ({ tag, limit, includeDrafts }) => {
      let posts = getPosts({ includeDrafts: includeDrafts ?? false });
      if (tag) posts = posts.filter((p) => p.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
      if (limit) posts = posts.slice(0, limit);
      const items = posts.map(({ body: _body, ...rest }) => rest);
      return { content: [{ type: 'text', text: JSON.stringify(items, null, 2) }] };
    }
  );

  mcp.tool(
    'get_post',
    'Get a single post by slug, including full markdown body',
    {
      slug: z.string().describe('Post slug'),
      includeDrafts: z.boolean().optional().describe('Allow returning a draft post'),
    },
    async ({ slug, includeDrafts }) => {
      const post = getPosts({ includeDrafts: includeDrafts ?? false }).find((p) => p.slug === slug);
      if (!post) return { content: [{ type: 'text', text: `Post not found: ${slug}` }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(post, null, 2) }] };
    }
  );

  mcp.tool(
    'list_projects',
    'List projects with optional status filter',
    { status: z.enum(['active', 'archived', 'wip']).optional().describe('Filter by status') },
    async ({ status }) => {
      let projects = getProjects();
      if (status) projects = projects.filter((p) => p.status === status);
      const items = projects.map(({ body: _body, ...rest }) => rest);
      return { content: [{ type: 'text', text: JSON.stringify(items, null, 2) }] };
    }
  );

  mcp.tool(
    'list_photography',
    'List photography galleries, newest first',
    { limit: z.number().int().positive().optional().describe('Maximum number of results') },
    async ({ limit }) => {
      let galleries = getPhotography();
      if (limit) galleries = galleries.slice(0, limit);
      return { content: [{ type: 'text', text: JSON.stringify(galleries, null, 2) }] };
    }
  );

  mcp.tool(
    'get_about',
    'Get the About page, including full markdown body',
    {},
    async () => {
      const page = getPage('about');
      if (!page) return { content: [{ type: 'text', text: 'About page not found' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(page, null, 2) }] };
    }
  );

  mcp.tool(
    'search_content',
    'Full-text search across posts, projects, photography, and the About page',
    { query: z.string().min(1).describe('Search query') },
    async ({ query }) => {
      const results = searchContent(query);
      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
    }
  );

  return mcp;
}

// ── HTTP server ──────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

const log = (method: string, path: string, status: number, ms: number) =>
  console.log(JSON.stringify({ ts: new Date().toISOString(), method, path, status, ms }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => log(req.method, req.path, res.statusCode, Date.now() - start));
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Hash both sides so the comparison is constant-time regardless of length.
const digest = (value: string) => createHash('sha256').update(value).digest();
const expectedAuth = AUTH_TOKEN ? digest(`Bearer ${AUTH_TOKEN}`) : undefined;

// Bearer token auth for all MCP endpoints
app.use((req, res, next) => {
  if (!expectedAuth) {
    console.warn('MCP_AUTH_TOKEN not set — rejecting all requests');
    res.status(500).json({ error: 'Server misconfigured: MCP_AUTH_TOKEN not set' });
    return;
  }
  const header = req.headers['authorization'] ?? '';
  if (!timingSafeEqual(digest(header), expectedAuth)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
});

// Streamable HTTP transport (current MCP spec). Stateless: a fresh server and
// transport per request, since every tool is a read-only lookup.
app.post('/mcp', async (req, res) => {
  const mcp = createServer();
  // No sessionIdGenerator means stateless mode.
  const transport = new StreamableHTTPServerTransport({});
  res.on('close', () => {
    void transport.close();
    void mcp.close();
  });
  // Cast works around the SDK's onclose typing under exactOptionalPropertyTypes.
  await mcp.connect(transport as Transport);
  await transport.handleRequest(req, res, req.body);
});

app.all('/mcp', (_req, res) => {
  res.status(405).set('Allow', 'POST').json({ error: 'Method not allowed' });
});

// Legacy HTTP+SSE transport, kept for clients that haven't moved to /mcp.
const sseTransports = new Map<string, SSEServerTransport>();

app.get('/sse', async (_req, res) => {
  const mcp = createServer();
  const transport = new SSEServerTransport('/messages', res);
  sseTransports.set(transport.sessionId, transport);
  res.on('close', () => {
    sseTransports.delete(transport.sessionId);
    void mcp.close();
  });
  await mcp.connect(transport);
});

app.post('/messages', async (req, res) => {
  const sessionId = req.query['sessionId'] as string | undefined;
  if (!sessionId) {
    res.status(400).json({ error: 'Missing sessionId' });
    return;
  }
  const transport = sseTransports.get(sessionId);
  if (!transport) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  await transport.handlePostMessage(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event: 'listening', port: PORT }));
});
