import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import { getPosts, getProjects, getResources, searchContent } from './content.js';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const AUTH_TOKEN = process.env['MCP_AUTH_TOKEN'];

// ── MCP server ──────────────────────────────────────────────────────────────

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
    if (tag) posts = posts.filter((p) => p.tags.includes(tag));
    if (limit) posts = posts.slice(0, limit);
    const items = posts.map(({ body: _body, ...rest }) => rest);
    return { content: [{ type: 'text', text: JSON.stringify(items, null, 2) }] };
  }
);

mcp.tool(
  'get_post',
  'Get a single post by slug, including full markdown body',
  { slug: z.string().describe('Post slug') },
  async ({ slug }) => {
    const post = getPosts({ includeDrafts: true }).find((p) => p.slug === slug);
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
  'list_resources',
  'List curated resources with optional category filter',
  { category: z.string().optional().describe('Filter by category') },
  async ({ category }) => {
    let resources = getResources();
    if (category) resources = resources.filter((r) => r.category.toLowerCase() === category.toLowerCase());
    const items = resources.map(({ body: _body, ...rest }) => rest);
    return { content: [{ type: 'text', text: JSON.stringify(items, null, 2) }] };
  }
);

mcp.tool(
  'search_content',
  'Full-text search across posts, projects, and resources',
  { query: z.string().min(1).describe('Search query') },
  async ({ query }) => {
    const results = searchContent(query);
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
  }
);

// ── HTTP / SSE server ────────────────────────────────────────────────────────

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

// Bearer token auth for all MCP endpoints
app.use((req, res, next) => {
  if (!AUTH_TOKEN) {
    console.warn('MCP_AUTH_TOKEN not set — rejecting all requests');
    res.status(500).json({ error: 'Server misconfigured: MCP_AUTH_TOKEN not set' });
    return;
  }
  const header = req.headers['authorization'];
  if (header !== `Bearer ${AUTH_TOKEN}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
});

// MCP SSE transport — one transport per connection
const transports = new Map<string, SSEServerTransport>();

app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/messages', res);
  transports.set(transport.sessionId, transport);
  res.on('close', () => transports.delete(transport.sessionId));
  await mcp.connect(transport);
});

app.post('/messages', async (req, res) => {
  const sessionId = req.query['sessionId'] as string | undefined;
  if (!sessionId) {
    res.status(400).json({ error: 'Missing sessionId' });
    return;
  }
  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  await transport.handlePostMessage(req, res);
});

app.listen(PORT, () => {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event: 'listening', port: PORT }));
});
