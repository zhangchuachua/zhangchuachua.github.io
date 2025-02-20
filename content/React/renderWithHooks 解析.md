---
title: renderWithHooks 解析
description: 函数组件最核心的函数就是 renderWithHooks，这篇文章针对 renderWithHooks 的源码进行了阅读，搞清楚 renderWithHooks 里面到底做了什么
tags:
- react
- sourcecode
create_date: 2025-02-20 14:17
slug: render-with-hooks
---

首先需要知道 Fiber 中的 `memoizedState, updateQueue, lanes` 属性是什么，可以看