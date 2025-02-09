import { createProcessor } from '@mdx-js/mdx';
import vFile from 'vfile';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';

export const processor = createProcessor({
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
        [
            rehypeRaw,
            {
                passThrough: ['mdxFlowExpression', 'mdxJsxFlowElement', 'mdxJsxTextElement', 'mdxTextExpression', 'mdxjsEsm']
            }
        ],
        rehypeSlug
    ],
    remarkRehypeOptions: {
        allowDangerousHtml: true,
        passThrough: ['mdxFlowExpression', 'mdxJsxFlowElement', 'mdxJsxTextElement', 'mdxTextExpression', 'mdxjsEsm']
    },
    jsxImportSource: 'astro',
    format: 'mdx',
    elementAttributeNameCase: 'html',
});

const vfile = new vFile({
    value: `
<linkbutton></linkbutton>
`
})