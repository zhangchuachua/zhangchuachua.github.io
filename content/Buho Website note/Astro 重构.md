> [!important] 最后因为下面的内容，而替换为了升级 next.js
> 
>   
> 1. Astro 中太过简陋很多东西需要自己实现, 需要太多时间；==重点==  
> 2. 不想用 vscode + webstorm 对 astro 支持不好  
> 3. client:load 指令只能在 astro 文件中使用，感觉不如 next.js 的  
> `use client` 灵活  
> 4. 博客渲染哪一块使用的是 React 组件总感觉不太对劲  
> 5. 全局状态管理不好使用（后来发现 next.js 服务器端也不能使用全局状态管理，context 在服务器端都无法使用)  
> 6. 多语言路由不好解决，需要多维护一个 cli 用于生成文件夹；==重点==  
> 7. 不支持 ISR  
> 8. 不支持 preview 模式；有利于 SEO 上架新文章时可以 preview  
>   
> Astro 的优点：  
> 1. 使用 vite 很多插件使用方便，比如 unocss  
> 2. 使用单页面应用，style 样式可以很方便的拆分  
> 3. 性能更好  
> 4. 图片优化更好，支持 picture  

## 集成 API 中 injectScript 的 stage 的执行顺序

```ts
import { type AstroIntegration } from 'astro'

export default (): AstroIntegration => {
  return {
    name: 'astro-i18next',
    hooks: {
      'astro:config:setup': async ({ config, injectScript }) => {
      	// 在每个 Astro 页面组件的 frontmatter 中作为单独的模块被导入。
      	// 在服务器端打印，所以这里是最先的
        injectScript('page-ssr', 'console.log("This runs during SSR")');

        // 在 <head> 内联脚本, 不会被 vite 压缩和解析，这里第二个打印
        injectScript('head-inline', 'console.log("This runs in <head> inline")');
        
        // 在 <body> 内插入脚本，这里第三个打印；
        injectScript('page', 'console.log("This runs in <body>")');

				// 在页面 hydration 之前，这里最后一个打印，如果不需要 hydration 的话，不会进行打印
        injectScript('before-hydration', 'console.log("This runs before hydration")');
      },
    },
  }
}
```

## astro 中 build 时如何加载其他的环境变量？

项目中定义了 `.env.production, .env.development, .env.staging` 三个环境变量文件

默认情况下，执行 `astro build` 时将会使用 `.env.production` 环境文件；可是在发测试服的时候是需要使用 `.env.staging` 环境文件进行打包的；所以需要进行一些修改；

在老项目中，使用的是 `next.js + webpack` 使用的是一个三方库 `env-cmd` 进行配置；

`Astro` 中并没有做特殊处理，所以直接使用的 `vite` 进行的处理，所以可以看看 [Vite 的文档](https://cn.vitejs.dev/guide/env-and-mode#env-files)，配置很简单只需要将 `astro build` 修改为 `astro build --mod staging`

> [!important] 需要注意：只有
> 
> `build` 可以配置环境变量文件，`dev` 是不可以的；

## 简单的使用 git-hook

简单实用 git-hook 可以使用 [`simple-git-hooks`](https://github.com/toplenboren/simple-git-hooks) 这个库，如果需要触发 hooks 时精细的控制，或者多个 hooks 之间的配合之类还是需要 husky 这种；

  

simple-git-hooks 的基本使用很简单，下面是一个示例，只需要将下面的内容放到 package.json 即可(需要手动执行一次 `npx simple-git-hooks` 这样 simple-git-hooks 才会去更新 git-hook 的配置)

```JSON
 "simple-git-hooks": {
    "pre-commit": "npx lint-staged"
  },
  "lint-staged": {
    "*": "eslint --fix"
  }
```

  

## astro 中渲染 remote-markdown

可以在 astro 中使用 astro-remote 渲染 remote markdown 内容，下面的内容不是错误的，而是尝试使用 react-markdown 时得出的结论，虽然被抛弃了；

### 为什么使用 react-markdown 来渲染 markdown 而不是 Astro

因为 Astro 仅仅支持引入的本地的静态 md 或 mdx 文件； astro 自定义了 vite-plugin 的，所以在编译引入的 md 文件时就可以进行处理；而对于请求得到的 md 内容；需要自行处理；

可以渲染 md 的 package 有很多，但是我们的 md 内容里面有很多的自定义组件，并且这些组件都是 react 组件，

大概有两个备选：

1. @mdx-js/mdx + @mdx-js/react 与 react-markdown；
2. react-markdown

第一个选择配置更麻烦，而且自己的配置没有经过实践不知道有没有问题，还是使用现成的库好一些；所以选择了 react-markdown；

两者都可以通过 remark 插件去获取 frontmatter

```ts
import React from 'react'
import { evaluateSync } from '@mdx-js/mdx'
import rehypeSlug from 'rehype-slug'
import remarkDirective from 'remark-directive'
import remarkDirectiveRehype from 'remark-directive-rehype'
import * as jsxRuntime from 'react/jsx-runtime'
import * as mdx from '@mdx-js/react'
import { MDXProvider } from '@mdx-js/react'
import Toc from './blog/Toc'
import { rehypeToc } from '@/util/unified/rehype-toc'

export function MDX({ content }: { content: string }) {
  const Content = evaluateSync(content, {
    remarkPlugins: [remarkDirective, remarkDirectiveRehype],
    rehypePlugins: [rehypeSlug, rehypeToc],
    Fragment: React.Fragment,
    ...jsxRuntime,
    ...mdx,
  }).default

  return (
    <MDXProvider components={{ toc: Toc }}>
      <Content />
    </MDXProvider>
  )
}
```

```ts
import type { FunctionComponent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkDirectiveRehype from 'remark-directive-rehype'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import Toc from './blog/Toc'
import { rehypeToc } from '@/util/unified/rehype-toc'

export const MD: FunctionComponent<{ content: string }> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkDirective, remarkDirectiveRehype]}
      rehypePlugins={[rehypeRaw, rehypeSlug, rehypeToc]}
      remarkRehypeOptions={{ allowDangerousHtml: true }}
      urlTransform={null}
      components={{ toc: Toc }}// 这里会 ts 报错，react-markdown 限制了标签名字
    >
      {content}
    </ReactMarkdown>
  )
}
```

### 为什么不能转换为 astro 组件

astro 组件不能应用在其他 ui 框架中，比如 react 中不能使用 astro 组件；

### 为什么使用的是 props.content 传递内容，而不是 children

在 Astro 中使用 react 组件，并且为 react 组件传递 children 时，例如： `<MD>{content}</MD>` 和 `<MD children={content} />`  
children 将会被包装为一个  
`<slot />` 的组件；但是某些情况下我只想要一个 string children 比如这里的 ReactMarkdown 如果 children 不是字符串，那就会渲染空白；（补充：slot 组件可以通过 children.props.value 获取字符串）  
所以这个时候需要将 string 作为 props 进行传递而不是 children; 所以 MD 使用 content 进行传递  

---

## 如何使用 astro-remote 渲染 markdown

在上面的内容，我们知道了，要将 mdast 活在 hast 渲染为 html，是需要运行时的

比如 react-markdown 就是用了 react 的运行时，将 `<alsoread></alsoread>` 这样的东西，在某个时候使用 react runtime 去执行 `Alsoread` 组件然后得到 html；

所以，如果要渲染 astro 组件，那么就需要 astro 的 runtime 而 `astro-remote` 就使用了 astro runtime;

```ts
import { renderJSX } from "astro/runtime/server/jsx";
import { jsx as h } from "astro/jsx-runtime";
import { transform, __unsafeHTML } from "ultrahtml";
import sanitize from "ultrahtml/transformers/sanitize";
import swap from "ultrahtml/transformers/swap";

import { type MarkedExtension, marked } from "marked";
import markedFootnote from "marked-footnote";
import { markedSmartypants } from "marked-smartypants";

import * as entities from "entities";

export function createComponentProxy(
	result: any,
	_components: Record<string, any> = {},
) {
	const components: Record<string, any> = {};
	for (const [key, value] of Object.entries(_components)) {
		if (typeof value === "string") {
			components[key] = value;
		} else {
			components[key] = async (
				props: Record<string, any>,
				children: { value: any },
			) => {
				if (key === "CodeBlock" || key === "CodeSpan") {
					props.code = entities.decode(JSON.parse(`"${props.code}"`));
				}
				const output = await renderJSX(
					result,
					h(value, { ...props, "set:html": children.value }),
				);
				return __unsafeHTML(output);
			};
		}
	}
	return components;
}
```

  

## 为什么使用 astro-remote 而不是 react-markdown

因为 react-markdown 中只能使用 react 组件；因为博客组件有一部分需要 client:load 可是 client:load 只能在 Astro 组件中使用；

所以如果要 client:load 那么只有将 react-markdown 以其渲染的组件全部转换为 client:load 那样的话，客户端将会加载很多 js 性能优化不明显；

## 为什么使用 cli 生成页面，而不是 […lang]

在当前版本中(4.8.6)，路由匹配有点问题，所以放弃了 `[…lang]`

目标的路由路径是这样的：

1. `/pages/[...lang]/index.astro`
2. `/pages/[...lang]/[category]/index.astro`
3. `/pages/[...lang]/[category]/[slug].astro`

当我访问 `/jp/how-to` 时，希望匹配到的是 `/pages/[...lang]/[category]/index.astro` 这个路由但是实际上匹配到了 `/pages/[...lang]/[category]/[slug].astro` ；所以真实的 Astro.params 是这样的: `{ lang: undefined, category: 'jp', slug: 'how-to' }`

这就是 Astro 的路由优先级的规则：明确的路由优先级更高；这是官方人员的[解释](https://github.com/withastro/astro/issues/11108#issuecomment-2122589194)；

  

## Astro 如何优化图片

## Picture 组件

首先是使用 `Picture` 组件，会传入一个 `formats` 属性，约定了要将图片格式化成那些格式；默认为 `[’webp’]` 如果传入了 `[’avif’, ‘webp’]` 那么会遍历 `formats` 然后进入 `getImage`

```js
const optimizedImages = await Promise.all(formats.map((format) => getImage(...)));
```

## getImage

### Astro 如何获取远程图片的宽高

当为 `Picture` 设置 `inferSize` 时，将由 Picture 获取宽高进行设置；具体流程如下：

```js
const response = await fetch(image);
const reader = response.body.getReader();
// while await reader.read() -> Unit8Array 将 reader 循环进行读操作，并且存放到 Unit8Array 中, 假设每次循环都存储到 chunks; 此时我们是只有图片等源数据的，还需要通过源数据去获取图片的类型（格式），宽度，高度等信息；判断这些内容应该有专门的库去做，比如 sharp
// 不同类型（格式）有不同的文件头信息，所以要获取文件类型，判断文件头即可；Astro 使用 chunks[0] 进行判断；比如 chunk[0] === 137 就是 png; 82 就是 webp
// 不同的类型，宽高等信息存储的位置不一样，所以根据不同的类型，去获取宽高信息；
// 当获取到 type, width, height 这些信息后，就停止循环，直接信息返回，不需要把整个图片读完；如果读完了还没获取到这些信息，那么抛出错误；
```

### 将 width, height 等信息 与 format 拼接到 url 中

接下来就开始根据 optinos 进行优化

```js
// 首先对 options 进行验证；
// services 是 Astro 提供的，但是开发者可以自己提供自己的 services
const validatedOptions = await services.validateOptoins(...);
// 根据 options 获取 srcset 返回一个数组
const srcSetTransforms = await services.getSrcSet(...);
// 根据 options 获取最终的 url，如果是本地，或者允许的远程 url 那么将会转换为 _image?href=源地址&width=width&height=height&f=webp... 这样的格式，这样格式的图片都会被 Astro 进行优化，一般使用 sharp 进行优化；
const imageURL = await sertices.getURL(...)
// 使用 srcSetTransforms 结合 imageURL 生成 srcset 数组
const srcSets = await Promise.all(srcSetTransforms.map(...));
```

Picture 组件做的操作就到此结束了，仅仅是根据 formats 构建对应的 url；然后就进行渲染了

```HTML
<picture>
	<source type="image/avif" src="...">
	<source type="image/webp" src="...">
	<image loading="lazy" decoding="async" src="..." {...} />
</picture>
```

## endpoint/node

渲染出上述的 picture 后，用户访问该页面，浏览器就会对请求对应的 url

astro 就会进入 `astro/dist/assets/endpoint/node.js` 中进行处理；

然后就会调用 `astro/dist/assets/services/sharp.js` (默认情况)中处理图片；

```js
// 剩下的内容除了调用 sharp 其实就没啥了
async transform(inputBuffer, transformOptions, config) {
    if (!sharp) sharp = await loadSharp();
    const transform = transformOptions;
    // svg 直接返回
    if (transform.format === "svg") return { data: inputBuffer, format: "svg" };
    // 加载 buffer
    const result = sharp(inputBuffer, {
      failOnError: false,
      pages: -1,
      limitInputPixels: config.service.config.limitInputPixels
    });
    // 下面就是进行处理的过程
    result.rotate()
    if (transform.height && !transform.width) {
      result.resize({ height: Math.round(transform.height) });
    } else if (transform.width) {
      result.resize({ width: Math.round(transform.width) });
    }
    if (transform.format) {
      let quality = void 0;
      if (transform.quality) {
        const parsedQuality = parseQuality(transform.quality);
        if (typeof parsedQuality === "number") {
          quality = parsedQuality;
        } else {
          quality = transform.quality in qualityTable ? qualityTable[transform.quality] : void 0;
        }
      }
      result.toFormat(transform.format, { quality });
    }
    const { data, info } = await result.toBuffer({ resolveWithObject: true });
    return {
      data,
      format: info.format
    };
  }
```

## astro@4.15.1 国际化问题调查

> [!important] 最终方案在第六点

1. 使用 `/[locale/page` 这样的路由，路径中必须包含 defaultLocale 也就是如果要访问首页的话，必须是 `/en/` 才行；
2. 如果设置为 `/[locale]/page` + `/en/...pages` 的组合，效果一样，必须携带 en
3. 如果使用 `/en-page` + `/[lang]/page` 的组合，当访问 `/zh-tw/how-to` 时将会匹配到 `/[category]/[slug].astro` 也就是 `category: zh-tw, slug: how-to` ；使用 rewrite 也不能达到想要的效果，因为 rewrite 只接收一个 url 不能指定使用那个组件进行渲染
4. 如果使用 `/[…locale]/page` 在 `**getStaticPaths**` **返回的数据中包含一个** `**{params: {locale: undefined}**` **在普通页面上表现正常，但是在动态路由中有意外；见 [issue](https://github.com/withastro/astro/issues/11108)**
    
    ```ts
    export const getStaticPaths = (() => {
      return [{ params: { lang: 'jp' } }, { params: { lang: undefined } }]
    }) satisfies GetStaticPaths
    ```
    
5. 在 middleware 中手动分发国际化路由：
    
    ```ts
    // 需要先在 astro.config.mjs 中设置 routing 为 manual
    import { defineMiddleware } from 'astro:middleware'
    
    export const onRequest = defineMiddleware(async (context, next) => {
      if(context.url.pathname === '/') {
        return next('/en')
      }
      return next();
    })
    ```
    
    astro 没有那么多路由逻辑，build 后，将会生成众多静态 html(除 SSR) 这些 html，将会根据这些 html 文件路径进行返回；所以如果没有 html 的话就回返回 404；
    
    所以上面的重写必须满足： `/en/index.html 与 /index.html` 都存在才可以；那这样就没有必要了；
    
6. 最终发现了集成 API 中的 injectRoute 避开上面的所有问题，需要在 `astro:config:setup` 中使用 injectRoute 注入路由，injectRoute 接受三个参数(在官网文档上只写了 2 个参数)
    
    1. pattern 将匹配的路径支持动态路径，比如 `/zh-tw/about` `/jp/[category]/[slug]` 因为第一段都是 langCode 所以不用担心优先级的问题
    2. entrypoint 匹配到的路径将使用哪个页面进行渲染，比如 `./src/pages/about.astro`
    3. prerender 决定是否预渲染, 不会继承原有页面的设置，比如 `./src/pages/[category]/[slug]/index.astro` 已经声明 prerender 为 false 但是 `/jp/[category]/[slug]` 依然默认为 true 所以需要在这里进行设置；
    
    使用 injectRoute 几乎能做到使用多语言文件夹 `(pages/zh-tw/..., /pages/jp/...)` 一样的效果
    

## astro 集成 i18next 的两种方式

1. 使用集成 api 中的 injectScript 注入脚本；
    
    1. `before-hydration` 比直接第二种方式更早在客户端执行脚本；最大限度保证客户端加载 json 的优先级；
    2. 自动为每个页面注入脚本，所以每个页面需要做的事情变少了，仅仅需要执行一个 `changeLanguage` ；
    3. i18next 客户端初始化完成后 `language` 也初始化完成；可以在客户端组件中使用这个 language 解决 astro 中不好在客户端组件获取 `currentLocale` 的问题；并且获取翻译时也不用传入 lng；
    
    ```js
    import { resolve } from "node:path";
    
    /**
     * @return {import('astro').AstroIntegration}
     */
    export default (options) => {
      return {
        name: "astro-i18next",
        hooks: {
          "astro:config:setup": async ({ config, injectScript }) => {
            const publicDir = config.publicDir.pathname;
            injectScript(
              "page-ssr",
              server({ ...options, publicDir }),
            );
            injectScript("before-hydration", client(options));
          },
        },
      };
    };
    
    function getOptions({ allLangs, originalLang }) {
      return {
        supportedLngs: Array.from(allLangs),
        fallbackLng: Array.from(originalLang),
        ns: "common",
        defaultNS: "common",
        lowerCaseLng: true,
        load: "currentOnly",
      };
    }
    
    function server({ allLangs, originalLang, publicDir }) {
      // import.meta.glob 仅支持静态字符串，不能是一个变量 https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars\#limitations
      const translations = import.meta.glob('/public/locales/*/*.json');
      // 此时 translations 可能为 { '/public/locales/en/common.json': () => import('/public/locales/en/common.json') } 所以不去执行结果，就不会加载文件；
      const ns = new Set();
      // 服务器端直接加载所有的 ns
      Object.keys(translations).forEach((key) => {
        const splited = key.split('/').slice(-1);
        const filename = splited[0].slice(0, -5);
        ns.add(filename);
      });
    
      const initOptions = {
        ...getOptions({ allLangs, originalLang }),
        // debug: true,
        ns: Array.from(ns),
        // 因为使用 fsBackend 同步加载翻译资源，所以需要设置 initImmediate 为 false
        initImmediate: false,
        backend: {
          loadPath: resolve(publicDir, 'locales/{{lng}}/{{ns}}.json'),
        },
      };
    
      return `import i18next from 'i18next';
    import { initReactI18next } from 'react-i18next';
    // 不能使用 httpBackend 和 i18next-resources-to-backend 两者都是异步的
    import fsBackend from "i18next-fs-backend";
    
    i18next.use(initReactI18next).use(fsBackend).init(${JSON.stringify(initOptions)});`;
    }
    
    function client({ allLangs, originalLang }) {
      const initOptions = {
        ...getOptions({ allLangs, originalLang }),
        detection: {
          order: ["path", "htmlTag"],
          caches: [],
        },
        backend: {
          loadPath: "/locales/{{lng}}/{{ns}}.json",
        },
      };
    
      return `import i18next from "i18next";
    import httpBackend from "i18next-http-backend";
    import LanguageDetector from "i18next-browser-languagedetector";
    import { initReactI18next } from "react-i18next";
    
    i18next.use(httpBackend).use(initReactI18next).use(LanguageDetector).init(${JSON.stringify(initOptions)});`;
    }
    ```
    
    需要在每个页面进行 `changeLanguage` 不能再 Layout 中执行；因为 Layout 被调用时都是 <Layout><children /></Layout> 这样；回先把 children 组装完成再传递给 Layout 所以相当于 Layout 是最后执行的； 设置默认语言最后执行肯定是不行的；把设置默认语言放在一个初始化函数中，再由页面直接执行就可以了；
    
2. 在页面或组件中初始化 i18next :
    
    1. 不用将 json 放到 public 中；
    
    ```ts
    // index.ts
    import { allLangs } from '@/config/page.ts'
    
    const fallbackLng = 'en'
    const defaultNS = 'common'
    
    export function getOptions(lng = fallbackLng, ns: string | string[] = defaultNS) {
      return {
        // debug: true,
        supportedLngs: Array.from(allLangs),
        // preload: languages,
        fallbackLng,
        lng,
        fallbackNS: defaultNS,
        defaultNS,
        ns,
        load: 'currentOnly' as const,
        lowerCaseLng: true,
      }
    }
    
    // server.ts
    import type { FlatNamespace, KeyPrefix } from 'i18next'
    import { createInstance } from 'i18next'
    import resourcesToBackend from 'i18next-resources-to-backend'
    import type { FallbackNs } from 'react-i18next'
    import { initReactI18next } from 'react-i18next/initReactI18next'
    
    import { getOptions } from '@/util/locale'
    
    async function initI18next(lng: string, ns: string | string[]) {
      // on server side we create a new instance for each render, because during compilation everything seems to be executed in parallel
      const i18nInstance = createInstance()
      await i18nInstance
        .use(initReactI18next)
        .use(resourcesToBackend((language: string, namespace: string) => {
          return import(`../../locales/${language}/${namespace}.json`)
        }))
        .init({
          ...getOptions(lng, ns),
        })
      return i18nInstance
    }
    
    export async function getServerTranslation<
      Ns extends FlatNamespace,
      KPrefix extends KeyPrefix<FallbackNs<Ns>> = undefined,
    >(
      lng: string,
      ns?: Ns,
      options: { keyPrefix?: KPrefix } = {},
    ) {
      const i18nextInstance = await initI18next(lng, Array.isArray(ns) ? ns as string[] : ns as string)
      return {
        t: i18nextInstance.getFixedT(lng, ns, options.keyPrefix),
        i18n: i18nextInstance,
      }
    }
    
    // client.ts
    // https://github.dev/i18next/next-app-dir-i18next-example-ts
    import type { FlatNamespace, KeyPrefix } from 'i18next'
    import i18next from 'i18next'
    import LanguageDetector from 'i18next-browser-languagedetector'
    import resourcesToBackend from 'i18next-resources-to-backend'
    import { useEffect, useState } from 'react'
    import { useCookies } from 'react-cookie'
    import type {
      FallbackNs,
      UseTranslationOptions,
      UseTranslationResponse,
    } from 'react-i18next'
    import {
      initReactI18next,
      useTranslation as useTranslationOrg,
    } from 'react-i18next'
    
    import { getOptions } from '@/util/locale'
    import { allLangs } from '@/config/page'
    
    const runsOnServerSide = typeof window === 'undefined'
    
    // on client side the normal singleton is ok
    i18next
      .use(initReactI18next)
      .use(LanguageDetector)
      .use(
        resourcesToBackend(async (language: string, namespace: string) => {
          const res = await import(`../../locales/${language}/${namespace}.json`)
    
          return res
        }),
      )
      .init({
        ...getOptions(),
        debug: true,
        lng: undefined, // let detect the language on client side
        detection: {
          order: ['path', 'htmlTag', 'cookie', 'navigator'],
        },
        preload: runsOnServerSide ? Array.from(allLangs) : [],
      })
    
    const cookieName = 'i18next'
    
    export function useTranslation<Ns extends FlatNamespace, KPrefix extends KeyPrefix<FallbackNs<Ns>> = undefined>(
      lng: string,
      ns?: Ns,
      options?: UseTranslationOptions<KPrefix>,
    ): UseTranslationResponse<FallbackNs<Ns>, KPrefix> {
      const [cookies, setCookie] = useCookies([cookieName])
      const ret = useTranslationOrg(ns, options)
      const { i18n } = ret
      if (runsOnServerSide && lng && i18n.resolvedLanguage !== lng) {
        i18n.changeLanguage(lng)
      }
      else {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [activeLng, setActiveLng] = useState(i18n.resolvedLanguage)
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (activeLng === i18n.resolvedLanguage) {
            return
          }
          setActiveLng(i18n.resolvedLanguage)
        }, [activeLng, i18n.resolvedLanguage])
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (!lng || i18n.resolvedLanguage === lng) {
            return
          }
          i18n.changeLanguage(lng)
        }, [lng, i18n])
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (cookies.i18next === lng) {
            return
          }
          setCookie(cookieName, lng, { path: '/' })
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [lng, cookies.i18next])
      }
      return ret
    }
    ```
    

### Astro 渲染流程(部分)(不一定准确)

以下面的 `index.astro` 作为示例

```ts
---
import { getFixedT, setDefaultNamespace } from 'i18next'

import Client from '@/components/Client'
import ProductLogo from '@/components/ProductLogo'
import Layout from '@/layouts/Layout.astro'
import { BUHONTFS } from '@/util/constants'
import { serverInit } from '@/util/init'
debugger;
console.log('index render')

await serverInit(Astro)
setDefaultNamespace('home')
const t = getFixedT(null, 'buhocleaner_home')
---

<Layout pathname="/">
  <Client id="cc" slot="cc" client:load />
  <div>
  <!--<AstroTrans t={t} defaults="Personen <heart>red</heart> BuhoCleaner">-->
  <!--  <Client style={{ color: 'red' }} slot="heart" />-->
  <!--</AstroTrans>-->
  </div>
  <h1>Home</h1>
  <p>{t('terms:title')}</p>
  <Client id="normal" client:load />
  <ProductLogo product={BUHONTFS} noBg className="text-50px" />
</Layout>
```

流程：

1. 首先肯定是渲染 index.astro 页面的，然后 index.astro 的 js 部分都将会进行执行
2. 开始渲染组件 Layout.astro
3. 通过 `async function renderComponent(result, displayName, Component, props, slots = {})` 函数渲染 Layout；
    1. result 是一个对象很多内容
    2. displayName 是 Layout
    3. Component 就是被包装的 Layout 组件
    4. props 就是传递给 Layout 的参数也就是 `{ pathanme: "/" }`
    5. slots 是 `{ cc: function, default: function }` 注意此时的 slots 是包装过的
4. 在 renderComponent 中，因为 Layout 是一个 Astro 组件，所以进入 `function renderAstroComponent(result, displayName, Component, props, slots = {})` 参数无变化
5. 进入 `createAstroComponentInstance` 创建一个 使用 `new AstroComponentInstance(…)` 实例
6. 在创建实例时，在 `constructor` 内部将会直接遍历 slots 并且执行包装过的 slot 获取其返回值；
    
    1. 执行 slot 时，也是进入了 `renderComponent` 然后进入了`renderFrameworkComponent` 分支
    
    注意，此时的 slots 是包装过的，也就是说执行这个 slots 并不会去渲染 slots 组件，而是获得了一个 `RenderTemplateResult` ；
    
    注意，slots 里面是包含了 default 的，所以相当于也获取了 children 的 `RenderTemplateResult`
    
      
    
    index
    
    → layout createAstroComponentInstance
    
    → slots.cc
    
    → client
    
    → renderFrameworkComponent 创建一个 { render }
    
    → slots.defaults
    
    → test
    
    → renderAstroComponent 创建一个 { render }
    
    → client
    
    → renderFrameworkComponent 创建一个 { render }
    
    → productLogo
    
    → renderFrameworkComponent 创建一个 { render }
    
    layout render: AstroComponentInstance.render
    
    → Header
    
    → renderFrameworkComponent 创建一个 { render }
    
    → Footer
    
    → renderFrameworkComponent 创建一个 { render }
    
    → test 执行 { render }
    

### Astro 中 react 水合错误

```ts
  useEffect(() => {
    // 注意：这里的 useEffect 在顶层，所以子组件的更新不会触发 useEffect 的重新执行；所以同一个页面中异步更新的 DOM 这里可能追踪不到；暂时不考虑这种情况
    const elsOfTracked = document.querySelectorAll('[data-track-appear]')

    // TODO 抽离
    const appearObserver = new IntersectionObserver(
      ([{ target, isIntersecting }]) => {
        if (!isIntersecting)
          return
        // 如果已经追踪过了，那么就不要再追踪了
        if (target.getAttribute('data-track-appear') === 'done') {
          return
        }
        console.log('appearObserver', target.getAttribute('data-track-appear'))
        const id = target.getAttribute('id')!
        trackGA4OfTargetDisplay(id, 'appear')
        target.setAttribute('data-track-appear', 'done')
      },
      { threshold: 0.7 },
    )

    elsOfTracked.forEach((el) => {
      appearObserver.observe(el)
    })

    return () => {
      appearObserver.disconnect()
    }
  }, [])
```

上述代码，在我的预想中不应该会出现问题，在我的预想中，大概的水合过程应该是这样的

1. 服务器把 html 发送到客户端
2. 客户端加载 js 包括 react
3. react 开始进行 `hydration`
    1. react 将会在客户端构建虚拟 DOM (使用 concurrent)然后与服务器端的 DOM 进行比较，如果不一致就会进行报错；如果存在差异， React 就会更新实际的 DOM 来匹配虚拟 DOM(存疑，GPT 说的）
    2. 事件绑定，react 将事件绑定到现有的 DOM 上
    3. 状态和生命周期管理：react 组件的状态和生命周期方法（如 useEffect）得以执行；
4. 水合完成

---

但是在实际项目中，却出现了报错：``react-dom.development.js:86 Warning: Prop `data-track-appear` did not match. Server: "done" Client: "true"``

**排查过程：**

1. 首先去网络检查器哪里查看 store 文档的源代码，发现服务器端 data-track-appear 的值确实是 true；那就说明是因为 useEffect 执行了，修改了 data-track-appear 的值
2. 然后去 debug 发现，ClientInit 组件(上述 useEffect 所属的组件) 在 hydration 后直接执行了，并没有等待 StoreButton 组件(出现 data-track-appear 问题的组件) hydration 完成；
    
    所以 useEffect 将会在 StoreButton 组件水合完成之前执行，然后 useEffect 进行了修改，StoreButton 在水合的时候发现问题进行报错；
    

---

**猜想：**

因为 Astro 的 island 所以这些 client:load 的组件都会被视为 island 然后在水合的时候每个 island 都是一个 hydrationRoot 所以水合完后将会直接执行；

刚好 ClientInit 组件是顶层的组件，所以它最先水合也就最先执行；此时其他的组件都还没开始水合；

这只是猜想，并不确定只是在 Astro 中是这样，还是 react 本身的 clientComponent 也会出现这样的问题