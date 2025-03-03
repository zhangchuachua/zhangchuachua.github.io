---
title: ref 原理
description: 
tags:
  - react
  - sourcecode
create_date: 2025-02-25 00:21
draft: true
---

- [ ] react 在什么时候设置的 ref？
- [ ] ref 是一个函数时，如果函数没有发生变化，那么 ref 会重新调用函数吗？
- [ ] 组件卸载时是否会置空 ref？组件是否每次更新都会卸载一次（对应触发 effect 的清理函数）？如果每次都置空了，那么虚拟列表中收集的元素也被清理了？清理了后就不能收集高度了？
- [ ] 