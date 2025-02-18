---
title: "@astro mdx 源码阅读"
description: ""
tags:
- 开发
- 前端
- astro
- 源码
created_at: 2025-02-07 14:39
share: true
filename: parse-astro-mdx-sourcecode.mdx
---

@astro/mdx 的源码地址位于[这里](https://github.dev/withastro/astro/blob/main/packages/integrations/mdx/src/)


```js
// remark plugins
const plugins = [
  remarkGfm,
  remarkSmartyPants,
  remarkCollectImages
];
// rehype plugins:
const plugins = [
  rehypeMetaString,
  [
    rehypeRaw,
    {
      "passThrough": [
        "mdxFlowExpression",
        "mdxJsxFlowElement",
        "mdxJsxTextElement",
        "mdxTextExpression",
        "mdxjsEsm"
      ]
    }
  ],
  [
    rehypeShiki,
    {
      "langs": [],
      "langAlias": {},
      "theme": "github-dark",
      "themes": {},
      "wrap": false,
      "transformers": []
    }
  ],
  rehypeImageToComponent,
  rehypeHeadingIds,
  rehypeInjectHeadingsExport,
  rehypeApplyFrontmatterExport,
  rehypeAnalyzeAstroMetadata
]

// all plugins
const plugins = [
	remarkParse,
	remarkMdx
	remarkMarkAndUnravel
	remarkGfm
	remarkSmartypants
	remarkCollectImages
	remarkRehype {
  "allowDangerousHtml": true,
  "passThrough": [
    "mdxFlowExpression",
    "mdxJsxFlowElement",
    "mdxJsxTextElement",
    "mdxTextExpression",
    "mdxjsEsm"
  ]
}
	rehypeMetaString
	rehypeRaw {
  "passThrough": [
    "mdxFlowExpression",
    "mdxJsxFlowElement",
    "mdxJsxTextElement",
    "mdxTextExpression",
    "mdxjsEsm"
  ]
}
	rehypeImageToComponent
	rehypeHeadingIds
	rehypeInjectHeadingsExport
	rehypeApplyFrontmatterExport
	rehypeAnalyzeAstroMetadata// 这个插件用于为 client:load 的组件添加 Meta 信息；
	rehypeRecma
	recmaDocument
	recmaJsxRewrite
	recmaJsx
	recmaBuildJsxTransform
	recmaJsx
	recmaStringify
]

```

如何渲染客户端组件：

使用 astro 包裹；既然 astro-remote 不能为 react 组件传递 client:load 那么，可以使用传递 astro 组件并在这个组件内部使用 react 组件并传递 client:load ，例如 LinkButton 组件

```astro
---
import LinkButton from '@/components/LinkButton.tsx'
---

<LinkButton client:load></LinkButton>
```

```jsx
export default function LinkButton() {
	return <button></button>
}
```

定义一个 astro 组件和一个 react 组件，使用 astro 组件包裹 react 组件；耗时更少，但是使用起来更麻烦，维护也麻烦一点

- [TODO] 第二种方法仿造 rehypeAnalyzeAstroMetadata 这个函数写一个 rehype 插件，这样就可以让 mdx 支持渲染 react 客户端组件了；明天写一个试一下

### Astro 中 <Content /> 的渲染过程

```js
import {render} from 'astro:content'

const {Content} = render(post); // 这个 render 来自于 astro/content/runtime.js 中的 renderEntry

```

首先使用的是 `const { Content } = await render(entry)` 这个 render 将会去执行 astro/content/runtime.ts/renderEntry 函数，然后执行同文件下的 render 函数

然后 render 函数执行 renderEntryImport 这个函数没有定义在文件中，而是一个 import，比如现在渲染的是 react-scheduler.mdx 这个文章，那么就相当于 import(react-scheduler.mdx) 这个 import 是关键，这样就会进入 vite 插件处理；也就是 @mdxjs/mdx 这一坨对 mdx 文件进行处理，然后进行返回；然后这个返回值进行一段处理后被包装成一个 astroComponent 进行返回，也就是 Content;

使用 `<Content components={...} />` 后，执行 renderComponent 然后进入 renderFrameworkComponent 使用框架进行渲染，针对这个 <Content /> 自然由 astro:jsx 进行渲染，而不是 react 之类的

然后进入 renderToStaticMarkup 这个函数，这个函数处于 @astrojs/mdx/server.js 中，不清楚是否因为我这个文件是 mdx 如果 markdown 可能就不会进入这个文件；

然后再进入 renderJSX 这个函数位于：astro/jsx-runtime/server/jsx.ts 中

然后再进入 renderJSXVNode 中，与 renderJSX 在一个文件；

猜想，针对 <Content /> 其实就是使用 mdx 去处理 markdown 然后 rehype 成 html string 还给 astro。astro 再进行渲染；

### mdx 中 html 格式的元素不会被渲染为 components

例如：

```markdown
<img src="..." alt="..." />

![...](...)
```

当使用 `<Content components={{ img: <CustomImage /> }} />` 渲染时，第一个图片并不会被渲染为 CustomImage;

这是因为 remak-mdx 将 `<img />` 解析为了 `type: mdxJsxFlowElement` 节点，而不是 `{ type: image }` 然后这种节点的 data 属性上会添加一个 `_mdxExplicitJsx: true` 然后在 recam-jsx-rewrite 插件中进行处理的时候会跳过含有 `_mdxExplicitJsx: true` 的节点，最终导致不会被渲染为 `components.img`

所以如果想要使用 jsx 的格式并渲染自定义组件的时候最好在 mdx 中引入组件，然后再使用：

```markdown
import {CustomImage} from '...';

<CustomImage ... />
```

如果是远程的 mdx 那就可以自定义一个 remark 组件来创建 import