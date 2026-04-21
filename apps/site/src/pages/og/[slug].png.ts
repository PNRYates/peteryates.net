import type { GetStaticPaths, APIContext } from 'astro';
import { getCollection } from 'astro:content';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createElement as h } from 'react';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('posts');
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { title: post.data.title, description: post.data.description },
  }));
};

const loadFont = (path: string): ArrayBuffer => {
  try {
    const buf = readFileSync(resolve(path));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    return new ArrayBuffer(0);
  }
};

const fontData = loadFont('node_modules/@fontsource/inter/files/inter-latin-400-normal.woff');
const fontBoldData = loadFont('node_modules/@fontsource/inter/files/inter-latin-700-normal.woff');

export async function GET({ props }: APIContext) {
  const { title, description } = props as { title: string; description: string };

  const element = h(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'flex-end',
        padding: '60px',
        background: '#0d1117',
        fontFamily: 'Inter',
      },
    },
    h('div', {
      style: {
        fontSize: '42px',
        fontWeight: 700,
        color: '#e6edf3',
        lineHeight: 1.2,
        marginBottom: '16px',
        maxWidth: '900px',
      },
      children: title,
    }),
    h('div', {
      style: {
        fontSize: '22px',
        color: '#8b949e',
        lineHeight: 1.4,
        maxWidth: '900px',
        marginBottom: '40px',
      },
      children: description,
    }),
    h('div', {
      style: { fontSize: '18px', color: '#58a6ff', fontWeight: 600 },
      children: 'peteryates.net',
    })
  );

  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: fontData, weight: 400, style: 'normal' },
      { name: 'Inter', data: fontBoldData, weight: 700, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const png = resvg.render().asPng();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
