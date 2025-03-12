---
title: astro 集成 i18next
description: astro 集成 i18next
tags:
- 前端
- astro
create_date: 2025-03-11 18:08
slug: astro-i18next
---

参考了 [astro-i18next](https://github.com/yassinedoghri/astro-i18next) 但是无法达到我想要的效果。

我想要达到的效果：

最重要的一点，在客户端组件中，可以使用翻译函数，astro-i18next 不支持

---

我正在重构网站，所以我有着大量的翻译文件和图片，astro- i18next 仅支持将 json 放在 public 目录中。

而我的翻译中间中将会引用国际化的图片，但是图片如果放在了 public 中， 就无法在 src 中使用 import 进行引入。但是如果将图片放在 src 中，在 json 中的图片，就无法被正常打包。

我更倾向于将图片都放在 `src/assets` 下，可以享受 vite 的打包优化，减少打包体积。要想 vite 对所有翻译文件中的图片都进行打包，就需要对这些文件都进行 import 才行，所以决定 json 修改为 ts，直接在翻译文件中使用 import 引入图片，然后使用。这样还有一个好处，不需要手动填图片的宽高了。

那么要在客户端如何加载这些翻译文件呢？

1. 嵌入到 html 中，显然不合理 html 太大了
2. 通过请求加载翻译文件

只能选 2，现在

1. 翻译文件是 ts 不是 json
2. 翻译文件放在 `/src/locales` 下，放在 public 下不能使用 import

于是需要开一个接口用于返回翻译文件， astro 中提供了 [API 端点](https://docs.astro.build/en/guides/endpoints/#server-endpoints-api-routes)可以实现这样的功能：

```ts title="src/api/[lang]/[ns].json.ts"
import type { APIRoute } from "astro";  

const allTranslations = import.meta.glob<{ default: object }>("/src/locales/*/*.ts");  
  
export function getStaticPaths() {  
  return Object.keys(allTranslations).map((path) => {  
    let [lang, name] = path.replace(/^\/src\/locales\//, "").split("/") as [string, string];  
    name = name.slice(0, -3);  
    return {  
      params: {  
        lang,  
        ns: name,  
      },  
    };  
  });  
}  
  
export const GET: APIRoute = async ({ params }) => {  
  const { lang, ns } = params;  
  const key = `/src/locales/${lang}/${ns}.ts`;  
  const module = allTranslations[key];  
  if (module) {  
    const translations = (await module()).default;  
    return new Response(JSON.stringify(translations));  
  }  
  return new Response(JSON.stringify({ message: "Not Found" }), {  
    status: 404,  
    statusText: "Not Found",  
  });  
};
```

集成代码如下所示，主要用于初始化 i18next

```ts title="src/integrations/i18next.ts"
import type { AstroIntegration } from "astro";  
import type { InitOptions } from "i18next";  
  
interface Options {  
  allLangs: string[];  
}  
export default function astroI18next(options: Options): AstroIntegration {  
  return {  
    name: "astro-i18next",  
    hooks: {  
      "astro:config:setup": async ({ injectScript }) => {
		// page-ssr 相当于插入到每个 astro 页面的顶部
        injectScript("page-ssr", server({ ...options }));  
        // 相当于插入一个 script 到客户端 html 中的 head 内
        injectScript("before-hydration", client({ ...options }));  
      },  
    },  
  };  
}  
  
function getOptions({ allLangs }: Options): InitOptions {  
  return {  
    supportedLngs: [...allLangs],  
    ns: ["common", "layout"],  
    defaultNS: "common",  
    lowerCaseLng: true,  
    load: "currentOnly",  
  };  
}  
function server({ allLangs }: Options) {  
  const initOptions = {  
    ...getOptions({ allLangs }),  
    preload: true, // 服务器端直接加载所有的语言，避免没有执行 getServerTranslation 的情况  
  };  
  
  return `import i18next from 'i18next';  
import { initReactI18next } from 'react-i18next';  
import resourcesToBackend from 'i18next-resources-to-backend';  
import { resolve } from 'node:path';  
  
const modules = import.meta.glob("/src/locales/**/*.ts");  
  
await i18next.use(initReactI18next).use(resourcesToBackend(async (lng, ns) => {  
  const path = resolve('/src', 'locales', lng, ns + '.ts');  const module = modules[path];  if(module) return module();  console.warn('@buho-cleaner/i18n: module not found; path:', path);})).init(${JSON.stringify(initOptions)});`;  
}  
  
function client({ allLangs }: Options) {  
  const initOptions = {  
    ...getOptions({ allLangs }),  
    detection: {  
      order: ["path", "htmlTag"],  
      caches: [],  
    },  
    backend: {
	  // 请求 api
      loadPath: "/api/{{lng}}/{{ns}}.json",
    },  
  };  
  
  return `import i18next from "i18next";  
import httpBackend from "i18next-http-backend";  
import LanguageDetector from "i18next-browser-languagedetector";  
import { initReactI18next } from "react-i18next";  
  
i18next.use(httpBackend).use(initReactI18next).use(LanguageDetector).init(${JSON.stringify(initOptions)});`;  
}
```