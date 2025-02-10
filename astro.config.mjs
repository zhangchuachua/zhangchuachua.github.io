import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import remarkCallout from '@r4ai/remark-callout';
import expressiveCode from 'astro-expressive-code';
import react from '@astrojs/react';
import { highlightComment } from './src/utils/shiki/highlight-comment';
import { setCodeLength } from './src/utils/shiki/setCodeLength';

// https://astro.build/config
export default defineConfig({
    site: 'https://zhangchuachua.github.io',
    integrations: [
        expressiveCode({
            themes: ['github-dark'],
            defaultProps: {
                wrap: true,
            },
            shiki: {
                transformers: [highlightComment]
            }
            // transformers: [highlightComment]
        }),
        sitemap(),
        tailwind({
            applyBaseStyles: false
        }),
        react(),
        mdx({})
    ],
    markdown: {
        remarkPlugins: [remarkCallout]
    }
});
