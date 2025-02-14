import { createProcessor } from '@mdx-js/mdx';

const p = createProcessor({
    remarkRehypeOptions: {
        allowDangerousHtml: true,
        passThrough: ['mdxFlowExpression', 'mdxJsxFlowElement', 'mdxJsxTextElement', 'mdxTextExpression', 'mdxjsEsm']
    },
    rehypePlugins: [],
    jsxImportSource: 'astro',
    format: 'mdx',
    mdExtensions: [],
    elementAttributeNameCase: 'html',
});

console.log(p);

const a = await p.process(`nihao 

![123](../../imgs/123.png)

<img src="../../imgs/about.jpeg" alt="about" />

## zhenbucuo`);

console.log(String(a.value));