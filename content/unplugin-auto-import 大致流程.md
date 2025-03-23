---
title: unplugin-auto-import 大致流程
description:
tags:
- 前端
- 源码
create_date: 2025-03-23 22:56
slug: unplugin-auto-import
---

[unplugin-auto-import](https://github.com/unplugin/unplugin-auto-import) 可以用于在项目中自动引入部分依赖，下面是阅读了 unplugin-auto-import 源码后的一些笔记

## [unplugin](https://unplugin.unjs.io/guide/)

unplugin 是 antfu 大佬为主要贡献者的一个旨在为各种构建工具提供统一插件系统的库，简单的来说，就是 unplugin 大致统一了构建工具的插件 api，使用 unplugin 开发的插件可以使用在兼容各种构建工具（不能完美兼容，但是提供了其他处理方法）。

unplugin 拓展了 [rollup](https://rollupjs.org/plugin-development/#plugins-overview) 的插件 api 所以 unplugin 提供的 api 的名字几乎都是从 rollup 中拿出来的。

## unplugin-auto-import

下面是 unplugin-auto-import 的插件声明，解释一下 unplugin hooks 的执行的先后顺序

```ts
export default createUnplugin<Options>((options) => {
  // 进行初始化，内部会根据配置创建一个 unimport
  let ctx = createContext(options)  
  return {
    name: 'unplugin-auto-import',
    // enforce 来自于 vite （类似于 webpack loader）可用于调整插件的执行顺序，这里是 post 表示在核心插件之后执行
    enforce: 'post',
    // 过滤出需要处理的文件
    transformInclude(id) {  
      return ctx.filter(id)  
    },
    // 在 transform 之前执行
    async buildStart() {  
      // 这一步收集了所有的 unimport 导入项  
      await ctx.scanDirs()  
    },
    // 所有需要处理的文件都在这里进行处理；
    async transform(code, id) {  
      return ctx.transform(code, id)  
    },
    // transform 之后执行
    async buildEnd() {  
      await ctx.writeConfigFiles()  
    },
    // 针对 vite 的处理
    vite: {
	    // ...
    },  
  }  
})
```

看过源码之后，发现 unplugin-auto-import 非常依赖 [unimport](https://github.com/unjs/unimport) 这个库

### buildStart

在这个 hooks 里面会根据配置文件获取所有的 import 

### transform

在这个 hooks 中，会针对文件进行处理：

首先处理 vue template 选项，比如下面的代码中，并没有引入 ok 但是却在 template 中直接使用了。

```vue
<template>
	<span>{{ok}}</span>
</template>
```

vue 文件经过编译后，因为 ok 不是来自于 `setup` 所以将其编译为 `_ctx.ok` 那么 unimport 将会找到所有的 `_ctx.*` 然后根据变量名查看 imports 中是否存在，如果存在，那么就会添加 import 并替换变量名.

> 会替换为 unref 格式的，所以还会另外添加 unref 会被重命名为 `__unimport_unref(*)` 避免重名

然后处理 vueDirectives 选项也是差不多的处理。

上面两个是最开始额外处理的，下面才进入批量处理的环节。

unimport 中支持两种方式进行操作：ast(acorn) 和 正则，下面说正则如何处理。

> unimport 中的正则写的比较烧脑，使用正则进行操作的文件：https://github.dev/unjs/unimport/blob/main/src/addons/addons.ts#L5
> 
> 使用 ast 进行操作的文件：https://github.dev/unjs/unimport/blob/main/src/addons/addons.ts#L5

会首先通过正则找到文件中大部分的变量，然后再通过正则过滤一部分出去。

然后再通过 importMap 过滤不支持的变量，仅仅剩下支持的变量。

最后把这些支持的 import 格式话成字符串，插入到文件中去。

> unimport 使用 [magic-string](https://github.com/rich-harris/magic-string) 处理字符串，这个库可以处理一些微小的字符串操作，并生成正确的 sourcemap


