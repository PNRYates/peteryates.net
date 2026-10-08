import rss from '@astrojs/rss';
import { getCollection, getEntry } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const siteSettings = await getEntry('siteSettings', 'site');
  if (!siteSettings) throw new Error('Site settings are missing');

  const posts = await getCollection('posts', (e) => !e.data.draft);
  posts.sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());

  return rss({
    title: siteSettings.data.siteName,
    description: siteSettings.data.defaultDescription,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `/posts/${post.id}`,
    })),
    customData: '<language>en-au</language>',
  });
}
