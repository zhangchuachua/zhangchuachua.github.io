import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import remarkCallout from '@r4ai/remark-callout';
import { highlightComment } from './src/utils/shiki/highlight-comment';
import { setCodeLength } from './src/utils/shiki/setCodeLength';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
    site: 'https://zhangchuachua.github.io',
    integrations: [
        mdx({}),
        sitemap(),
        tailwind({
            applyBaseStyles: false
        }),
        react()
    ],
    markdown: {
        remarkPlugins: [remarkCallout],
        shikiConfig: {
            wrap: true,
            transformers: [setCodeLength, highlightComment]
        }
    }
});
