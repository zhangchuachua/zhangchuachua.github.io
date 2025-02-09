import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import remarkCallout from '@r4ai/remark-callout';

import react from '@astrojs/react';
import { rehypeCodeLength } from './src/utils/unified/rehype-code-length.ts';

// https://astro.build/config
export default defineConfig({
    site: 'https://zhangchuachua.github.io',
    integrations: [
        mdx({
            rehypePlugins: [rehypeCodeLength]
        }),
        sitemap(),
        tailwind({
            applyBaseStyles: false
        }),
        react()
    ],
    markdown: {
        remarkPlugins: [remarkCallout],
        rehypePlugins: [rehypeCodeLength],
        shikiConfig: {
            wrap: true
        }
    }
});
