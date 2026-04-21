import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    status: z.enum(['active', 'archived', 'wip']),
    repo: z.string().url().optional(),
    url: z.string().url().optional(),
    tech: z.array(z.string()).default([]),
    startedAt: z.coerce.date(),
  }),
});

const resources = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.string(),
    url: z.string().url(),
    description: z.string(),
    addedAt: z.coerce.date(),
  }),
});

export const collections = { posts, projects, resources };
