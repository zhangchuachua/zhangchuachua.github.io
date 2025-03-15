---
title: useEffect, useInsertionEffect, useLayoutEffect 原理
description: useEffect, useInsertionEffect, useLayoutEffect 原理
tags:
- react
- 源码
create_date: 2025-03-15 23:05
slug: react-function-component-effect
---

这三种 effect 都共用 mountEffectImpl 与 updateEffectImpl 只是传入的参数不一样。

> [!tip] useInsertEffect 是什么？
> 是 react 专门为 css-in-js 作者开发的，用户不需要专门去了解，这是[文档](https://zh-hans.react.dev/reference/react/useInsertionEffect);

## mountEffectImpl

当组件挂载的时候执行

第一步依然是 [[Fiber 如何构建 Hook 链表？]] 中的 mountWorkInProgress 创建 Hook 对象并连接 Hook 链表。

第二部给 fiber 添加副作用(fiber.flags)，不同的 effect 副作用不同

1. useEffect: PassiveEffect | PassiveStaticEffect
2. userInsertionEffect: UpdateEffect
3. useLayoutEffect: UpdateEffect

不同的副作用在 [[commit 阶段]]中将会在不同的时间点进行处理，比如 useLayoutEffect 在 layoutMutation 中执行，在屏幕绘制之前触发；

> [!tip]- 补充 useLayoutEffect
> 注意，浏览器 debug 的时候浏览器也不会停止绘制，因为在测试 useLayoutEffect 的时候，断点设置在了 useLayoutEffect 内部，但是暂停时修改的样式依然生效了。
> 
> 后面使用 `while(Date.now() - before < 2000){}` 进行验证才发现。所以 useLayoutEffect 在页面绘制完成之前就是因为它是同步代码，会阻塞 js 主线程。

然后执行 pushEffect，这个函数将会

1. 创建一个 Effect 对象
2. 连接成链表（依然是循环链表），并赋值给函数组件的 updateQueue.

不同的 effect 创建的 Effect 对象的 tag 是不一样的，不同的 tag 也有不同的作用：

1. useEffect: HookPassive + HookHasEffect
2. useInsertionEffect: UpdateEffect + HookHasEffect
3. useLayoutEffect: HookLayout  + HookHasEffect

其中 HookHasEffect 表示这个 effect 需要被执行，因为是 mount 每个 effect 挂载时一定会执行，所以 mountEffectImpl 中一定会传入 HookHasEffect

HookPassive, UpdateEffect, HookLayout 主要用于标识不同的的 effect，因为所有的 effect 将会连接成一个链表，所以在 commit 阶段要处理 effect 时，需要进行分辨，然后再观察是否处理。

## updateEffectImpl

当组件更新时执行。

第一步依然是 [[Fiber 如何构建 Hook 链表？]] 中的 updateWorkInProgressHook 获得之前的 Hook 对象（一个新的对象，但是值将会复用）。

第二步，检查 deps 是否有更新（遍历每个 deps 然后使用 Object.is 检查是否一样），如果没有更新，执行 pushEffect；如果有更新同样使用 pushEffect 不过这次加上了 HookHasEffect 表示这个 effect 需要处理。