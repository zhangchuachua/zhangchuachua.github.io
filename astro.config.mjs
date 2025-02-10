import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import remarkCallout from '@r4ai/remark-callout';
import expressiveCode from 'astro-expressive-code';
import react from '@astrojs/react';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections';
import { highlightComment } from './src/utils/shiki/highlight-comment';
import { remarkSetCodeCollapse } from './src/utils/unified/remark-set-code-collapse';

// https://astro.build/config
export default defineConfig({
    site: 'https://zhangchuachua.github.io',
    integrations: [
        sitemap(),
        tailwind({
            applyBaseStyles: false
        }),
        react(),
        expressiveCode({
            defaultProps: {
                wrap: true,
                showLineNumbers: true
            },
            shiki: {
                transformers: [
                    highlightComment,
                    {
                        preprocess(code, options) {
                            const length = code.split('\n').length;
                            if (length > 25) {
                            }
                        }
                    }
                ]
            },
            themes: ['github-dark'],
            plugins: [pluginCollapsibleSections(), pluginLineNumbers()]
        }),
        mdx({})
    ],
    markdown: {
        remarkPlugins: [remarkCallout, remarkSetCodeCollapse],
        rehypePlugins: []
    }
});
