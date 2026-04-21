import { readdirSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = process.env['CONTENT_DIR'] ?? join(import.meta.dirname, '../../site/src/content');

interface Post {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  draft: boolean;
  body: string;
}

interface Project {
  slug: string;
  title: string;
  description: string;
  status: 'active' | 'archived' | 'wip';
  repo?: string;
  url?: string;
  tech: string[];
  startedAt: string;
  body: string;
}

interface Resource {
  slug: string;
  title: string;
  category: string;
  url: string;
  description: string;
  addedAt: string;
  body: string;
}

function readDir(subdir: string): Array<{ slug: string; data: Record<string, unknown>; body: string }> {
  const dir = join(CONTENT_DIR, subdir);
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  } catch {
    return [];
  }
  return files.map((file) => {
    const raw = readFileSync(join(dir, file), 'utf-8');
    const { data, content } = matter(raw);
    const slug = basename(file).replace(/\.mdx?$/, '');
    return { slug, data, body: content };
  });
}

export function getPosts(opts: { includeDrafts?: boolean } = {}): Post[] {
  return readDir('posts')
    .filter((e) => opts.includeDrafts || !e.data['draft'])
    .map((e) => ({
      slug: e.slug,
      title: String(e.data['title'] ?? ''),
      description: String(e.data['description'] ?? ''),
      publishedAt: String(e.data['publishedAt'] ?? ''),
      ...(e.data['updatedAt'] ? { updatedAt: String(e.data['updatedAt']) } : {}),
      tags: Array.isArray(e.data['tags']) ? (e.data['tags'] as string[]) : [],
      draft: Boolean(e.data['draft']),
      body: e.body,
    }))
    .sort((a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf());
}

export function getProjects(): Project[] {
  return readDir('projects').map((e) => ({
    slug: e.slug,
    title: String(e.data['title'] ?? ''),
    description: String(e.data['description'] ?? ''),
    status: (e.data['status'] as Project['status']) ?? 'wip',
    ...(e.data['repo'] ? { repo: String(e.data['repo']) } : {}),
    ...(e.data['url'] ? { url: String(e.data['url']) } : {}),
    tech: Array.isArray(e.data['tech']) ? (e.data['tech'] as string[]) : [],
    startedAt: String(e.data['startedAt'] ?? ''),
    body: e.body,
  }));
}

export function getResources(): Resource[] {
  return readDir('resources')
    .map((e) => ({
      slug: e.slug,
      title: String(e.data['title'] ?? ''),
      category: String(e.data['category'] ?? ''),
      url: String(e.data['url'] ?? ''),
      description: String(e.data['description'] ?? ''),
      addedAt: String(e.data['addedAt'] ?? ''),
      body: e.body,
    }))
    .sort((a, b) => new Date(b.addedAt).valueOf() - new Date(a.addedAt).valueOf());
}

export function searchContent(query: string): Array<{ type: string; slug: string; title: string; snippet: string }> {
  const q = query.toLowerCase();
  const results: Array<{ type: string; slug: string; title: string; snippet: string }> = [];

  const snippet = (text: string): string => {
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text.slice(0, 120).trim() + '…';
    const start = Math.max(0, idx - 60);
    const end = Math.min(text.length, idx + 120);
    return (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
  };

  for (const post of getPosts({ includeDrafts: false })) {
    if (post.title.toLowerCase().includes(q) || post.description.toLowerCase().includes(q) || post.body.toLowerCase().includes(q)) {
      results.push({ type: 'post', slug: post.slug, title: post.title, snippet: snippet(post.description + ' ' + post.body) });
    }
  }
  for (const project of getProjects()) {
    if (project.title.toLowerCase().includes(q) || project.description.toLowerCase().includes(q) || project.body.toLowerCase().includes(q)) {
      results.push({ type: 'project', slug: project.slug, title: project.title, snippet: snippet(project.description + ' ' + project.body) });
    }
  }
  for (const resource of getResources()) {
    if (resource.title.toLowerCase().includes(q) || resource.description.toLowerCase().includes(q)) {
      results.push({ type: 'resource', slug: resource.slug, title: resource.title, snippet: snippet(resource.description) });
    }
  }

  return results;
}
