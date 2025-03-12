---
title: astro 国际化路由
description: astro 国际化路由
tags:
- 前端
- astro
create_date: 2025-03-11 17:26
slug: astro-i18n-route
---

astro 官方支持 [i18n](https://docs.astro.build/en/guides/internationalization/) 但是要求每个语言都创建一个目录，每个语言都单独去进行开发。

当不同语言的样式相同，且定制化，且维护人员不多时，带来了很大的维护压力，这样的话，就可以自定义一个 integration 去解决这个问题。

使用 integration api 中的 [injectRoute](https://docs.astro.build/en/reference/integrations-reference/#injectroute-option)

```js title="injectRoute"
injectRoute({
// Use Astro’s pattern syntax for dynamic routes.
pattern: '/subfolder/[dynamic]',
// Use relative path syntax for a local route.
entrypoint: './src/dynamic-page.astro',
// Use only if Astro can't detect your prerender export
prerender: false
});
```

上面是 injectRoute 的使用方法，这意味着，必须维护一个网页的静态配置文件，类型应该是这样：

```ts
const allRoute = new Map([
	['/', { supportedLang: ['en', 'zh'], entrypoint: 'src/pages/xxx.astro' , prerender: true] }],
	['/blog/[category]', { supportedLang: ['en', 'zh'], entrypoint: 'src/pages/xxx.astro' , prerender: true] }],
	// ...
])
```

1. 页面支持的语言
2. 用于渲染该页面的 Astro 组件
3. 是否预渲染

集成代码如下：

```ts
import type { AstroIntegration } from "astro";  
  
interface PageConfig {  
  supportedLangs: Set<string>;  
  component?: string;  
  prerender?: boolean;  
  [key: string]: any;  
}  
  
interface InjectI18nRouteOptions {  
  allPages: Map<string, PageConfig>;  
}  
  
function injectI18nRoute({ allPages }: InjectI18nRouteOptions): AstroIntegration {  
  return {  
    name: "inject-i18n-route",  
    hooks: {  
      "astro:config:setup": ({ injectRoute }) => {  
        allPages.forEach(({ component, supportedLangs, prerender = true }, pathname) => {  
          if (component) {  
            supportedLangs.forEach((lang) => {  
              if (lang === "en") {  
                return;  
              }  
              let tmp = `/${lang}${pathname}`;  
              if (tmp.endsWith("/")) {  
                tmp = tmp.slice(0, -1);  
              }  
              injectRoute({  
                pattern: tmp,  
                entrypoint: `./${component}`,  
                prerender,  
              });  
            });  
          }  
        });  
      },  
      "astro:route:setup": ({ route }) => {  
        allPages.forEach(({ component, prerender = true }) => {  
          if (route.component !== component) return;  
          route.prerender = prerender;  
        });  
      },  
    },  
  };  
}  
  
export default injectI18nRoute;
```