import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
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
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
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

const photography = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/photography' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    url: z.string().url(),
  }),
});

const homePage = defineCollection({
  loader: glob({ pattern: 'home.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    intro: z.string().default(''),
    showLatestGallery: z.boolean().default(true),
    featuredGallery: z.string().optional(),
    latestGalleryHeading: z.string(),
    allPhotographyLabel: z.string(),
    galleryCta: z.string(),
    recentPostsHeading: z.string(),
    allPostsLabel: z.string(),
    emptyPostsMessage: z.string(),
    recentPostCount: z.number().int().min(1).max(20).default(5),
  }),
});

const aboutPage = defineCollection({
  loader: glob({ pattern: 'about.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const siteSettings = defineCollection({
  loader: glob({ pattern: 'site.md', base: './src/content/settings' }),
  schema: z.object({
    siteName: z.string(),
    defaultDescription: z.string(),
    footerName: z.string(),
    navigation: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })),
    socialLinks: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })).default([]),
  }),
});

export const collections = {
  posts,
  projects,
  photography,
  homePage,
  aboutPage,
  siteSettings,
};
