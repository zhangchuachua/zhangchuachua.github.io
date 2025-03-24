---
title: babel 插件开发
description:
tags:
- babel
- 前端
create_date: 2025-03-21 16:50
slug: develop-babel-plugin
draft: true
---

参考：

1. [babel 插件手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md)
2. [掘金：深入浅出 babel 上篇](https://juejin.cn/post/6844903956905197576#heading-0)

## 实践后遇到的问题

### 本地直接使用自己的 babel 插件

仅限于开发 babel-plugin-svgr-unique-id 中

> **不确定 babel 是否完全不支持直接调用 esm 的插件，仅仅在 svgr 这个环境下**

1. 不能使用 esm ,需要使用 commonjs
2. 当 package.json 中声明了 `"type": "module"` 后会直接报错，即使使用 commonjs 依然报错；需要使用 cjs，例如 `babel-plugin-svgr-unique-id.cjs` 这样才行。这个问题是在 vite 项目中遇到的
3. 使用插件时，只能输入字符串，让 babel 自行加载插件；这样在 turborepo 管理的项目中就有一个问题，我的 shared-config 中进行了配置，使用了 babel 插件；让我在 /apps/blog 中使用这个配置时，因为没有下载插件导致报错；解决方法：使用 peerDependenices 让要使用这个包的项目必须安装。