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

const headshotsPage = defineCollection({
  loader: glob({ pattern: 'headshots.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tagline: z.string(),
    location: z.string(),
    contactEmail: z.string().email(),
    packages: z.array(z.object({
      name: z.string(),
      price: z.number(),
      duration: z.string(),
      delivery: z.string(),
      highlighted: z.boolean().default(false),
      bookingUrl: z.string().url().or(z.literal('')).default(''),
      features: z.array(z.string()).default([]),
    })),
    steps: z.array(z.object({
      title: z.string(),
      body: z.string(),
    })).default([]),
    faq: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).default([]),
    photos: z.array(z.object({
      src: z.string(),
      alt: z.string(),
    })).default([]),
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
  headshotsPage,
  siteSettings,
};
