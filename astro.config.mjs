import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import expressiveCode from 'astro-expressive-code';
import react from '@astrojs/react';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections';
import { highlightComment } from './src/utils/shiki/highlight-comment';
import { remarkSetCodeCollapse } from './src/utils/unified/remark-set-code-collapse';
import { rehypeSetCodeClass } from './src/utils/unified/rehype-set-code-class';
import { remarkCallout } from '@r4ai/remark-callout';

// https://astro.build/config
export default defineConfig({
    site: 'https://zhangchuachua.github.io',
    integrations: [
        sitemap(),
        tailwind({
            applyBaseStyles: false,
            nesting: true
        }),
        react(),
        expressiveCode({
            defaultProps: {
                wrap: true,
                showLineNumbers: true,
                collapseStyle: 'collapsible-auto'
            },
            shiki: {
                transformers: [highlightComment]
            },
            themes: ['github-dark'],
            rehypePlugins: [rehypeSetCodeClass],
            plugins: [pluginCollapsibleSections(), pluginLineNumbers()]
        }),
        mdx()
    ],
    markdown: {
        remarkPlugins: [remarkCallout, remarkSetCodeCollapse],
        // rehypePlugins: [rehypeSetCodeClass]// 这里插入的组件将会在 expressive-code 之前被执行
    }
});
