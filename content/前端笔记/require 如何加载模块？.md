---
title: require 如何加载模块？
description:
tags:
- 开发
- 前端
create_date: 2025-03-18 10:52
slug: how-to-load-module-with-require
draft: true
---

1. 检查路径是否是核心模块，例如fs, os 这种，如果是核心模块则加载，否则进入下一步
2. 检查路径是否是以 /, ./, ../ 开头
3. 如果是以 /, ./, ../ 开头
	1. 首先尝试作为文件加载，如果有拓展名则直接加载；如果没拓展名，require 会尝试进行加载一些预设的拓展名；依然加载失败的话进入下一步
	2. 作为目录进行加载，检查路径中是否有 package 如果有就尝试加载 package.json 中的 main 属性。如果没有就尝试加载目录下的默认文件，比如 index.js, index.json, index.node 等，如果还是没有则抛出错误
4. 如果不是以 /, ./, ../ 开头，则认为是模块，会从当前目录开始向上查找 node_modules 目录，并尝试从 node_modules 中进行加载，加载的方式与 3 一样。如果直到根目录依然无法找到，那么抛出错误。