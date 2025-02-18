---
title: Astro 加载器 API
description: Astro 官方文档中对于加载器 API 的解释不够详细，在这里补充一下
tags:
- 开发
- 前端
- astro
create_date: 2025-02-18 11:30
filename: astro-content-loader-api
share: true
---

1. [Astro 官方文档](https://docs.astro.build/zh-cn/reference/content-loader-reference/#%E5%86%85%E8%81%94%E5%8A%A0%E8%BD%BD%E5%99%A8)

Astro 中的内容加载器可以有两种形式：

1. 内联加载器
2. 对象加载器

## 内联加载器

```ts
// src/content.config.ts
const countries = defineCollection({
  // 内联加载器可以是一个 异步函数
  loader: async () => {
    const response = await fetch("...");
    const data = await response.json();
    // 内联加载器必须返回一个具有 id 属性的条目数组
    // 或是一个以 ID 作为键、以条目作为值的对象
    return data.map((country) => ({
      id: country.cca3,
      ...country,
    }));
  },
  schema: /* ... */
});
```

## 对象加载器

对象加载器更强大，可以通过 context 获取更大的权限进行设置。

```ts
// src/content.config.ts
import type { Loader, LoaderContext } from 'astro/loaders';
import { z } from 'astro:content';

// *这是对象加载器，必须是一个普通的函数，不能是异步函数，异步函数将会返回 Promise<Loader> 那么 astro 就会把它当作内联加载器进行处理
export function myLoader(options: { options }): Loader {
  // 返回一个加载器对象
  return {
    name: "my-loader",
    // *详细看下面针对 glob 的源码
    // load 函数可以是一个异步函数，它接收一个 LoaderContext 对象‘但是它的返回值应该为 void 也就是不进行返回；而是使用 context 进行管理
    load: async (context: LoaderContext): Promise<void> => {
	    // ...
    },
    // （可选）定义条目的模式，它将被用户定义的模式覆盖。
    schema: async () => z.object({
      // ...
    })
  };
}

import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  loader: myLoader({...options}),
  schema: /* ... */
});
```

glob 就是一个对象加载器，下面是 glob 的部分源码：

```ts
// https://github.com/withastro/astro/blob/astro%405.3.0/packages/astro/src/content/loaders/glob.ts

export function glob(globOptions: GlobOptions): Loader {
	const fileToIdMap = new Map<string, string>();

	return {
		name: 'glob-loader',
		load: async ({ config, logger, watcher, parseData, store, generateDigest, entryTypes }) => {
			// ...
			// 使用 fast-glob 获取指定的 file
			const files = await fastGlob(globOptions.pattern, {
				cwd: fileURLToPath(baseDir),
			});
			// 处理 files
			await Promise.all(
				files.map((entry) => {
					// limit 是 p-limit 的返回值，用于限制多线程
					return limit(async () => {
						// *通过 ext 获取对应的配置，比如 .md 就会获取到针对 markdown 的配置类型为 ContentEntryType
						const entryType = configForFile(entry);
						// 将 file 经过处理后放到 store 里面，getCollection 就是从 store 里面拿的数据
						await syncData(entry, baseDir, entryType);
					});
				}),
			);

			async function syncData(...) {
				// entryType 获取对应的配置
				if (entryType.getRenderFunction) {

					let render = renderFunctionByContentType.get(entryType);
					if (!render) {
						render = await entryType.getRenderFunction(config);
						// Cache the render function for this content type, so it can re-use parsers and other expensive setup
						renderFunctionByContentType.set(entryType, render);
					}
					let rendered: RenderedContent | undefined = undefined;

					try {
						rendered = await render?.({
							id,
							data,
							body,
							filePath,
							digest,
						});
					} catch (error: any) {
						logger.error(`Error rendering ${entry}: ${error.message}`);
					}
					// !数据放到 store 里面
					store.set({
						id,
						data: parsedData,
						body,
						filePath: relativePath,
						digest,
						rendered,
						assetImports: rendered?.metadata?.imagePaths,
						legacyId,
					});

					// todo: add an explicit way to opt in to deferred rendering
				} else if ('contentModuleTypes' in entryType) {
					store.set({
						id,
						data: parsedData,
						body,
						filePath: relativePath,
						digest,
						deferredRender: true,
						legacyId,
					});
				} else {
					store.set({ id, data: parsedData, body, filePath: relativePath, digest, legacyId });
				}
			}
		};
	}
}
```