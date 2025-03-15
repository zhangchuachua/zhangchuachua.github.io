---
title: renderWithHooks 解析
description: 函数组件最核心的函数就是 renderWithHooks，这篇文章针对 renderWithHooks 的源码进行了阅读，搞清楚 renderWithHooks 里面到底做了什么
tags:
- react
- sourcecode
create_date: 2025-02-20 14:17
slug: render-with-hooks
---

```js title="react-reconciler/src/ReactFiberHooks"
export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes
): any {
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress;

  // *每个组件执行之前，都会重置这三个属性
  workInProgress.memoizedState = null;// Hook 链表
  workInProgress.updateQueue = null;// 副作用链表
  workInProgress.lanes = NoLanes;// 优先级

    // -这一块就是为什么 Hook 挂载时和更新时执行的函数不一样的原因；
  ReactCurrentDispatcher.current =
    current === null || current.memoizedState === null
      ? HooksDispatcherOnMount// 挂载时的 Hook
      : HooksDispatcherOnUpdate;// 更新时的 Hook

  // 执行组件函数，获取 children
  let children = Component(props, secondArg);

  // 是不是在 render 阶段触发了更新
  if (didScheduleRenderPhaseUpdateDuringThisPass) {
    let numberOfReRenders: number = 0;
    do {
      didScheduleRenderPhaseUpdateDuringThisPass = false;
      localIdCounter = 0;

      if (numberOfReRenders >= RE_RENDER_LIMIT) {
        throw new Error(
          'Too many re-renders. React limits the number of renders to prevent ' +
          'an infinite loop.',
        );
      }

      numberOfReRenders += 1;
      currentHook = null;
      workInProgressHook = null;

      workInProgress.updateQueue = null;

      ReactCurrentDispatcher.current = __DEV__
        ? HooksDispatcherOnRerenderInDEV
        : HooksDispatcherOnRerender;

      children = Component(props, secondArg);
    } while (didScheduleRenderPhaseUpdateDuringThisPass);
  }

  // 重新为 Hook 提供商赋值。所以在函数组件外使用 Hook 才会报错
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;

  // 检查 hook 是否变少
  const didRenderTooFewHooks =
    currentHook !== null && currentHook.next !== null;

  renderLanes = NoLanes;
  currentlyRenderingFiber = (null: any);

  currentHook = null;
  workInProgressHook = null;

  didScheduleRenderPhaseUpdate = false;
  // This is reset by checkDidRenderIdHook
  // localIdCounter = 0;

  if (didRenderTooFewHooks) {
    throw new Error(
      'Rendered fewer hooks than expected. This may be caused by an accidental ' +
      'early return statement.',
    );
  }

  return children;
}
```

首先需要知道 Fiber 中的 `memoizedState, updateQueue` 属性是什么，首先不同的类型 fiber 的这三个属性存储的内容是不一样的；这里解释的是函数组件的这三个属性

- memoizedState 用于存储 Hook 对象链表
- updateQueue 用于存放副作用链表，只能是 effect 创建的 Effect 对象；

不管是挂载还是更新，在每个函数组件执行之前，都会重置 `memoizedState, updateQueue, lanes` 

然后通过判断当前组件是挂载还是更新，得到 hooks 的上下文；比如 useState 在挂载阶段调用的其实是 mountState 如果是更新阶段调用的是 updateState；

然后就开始执行函数组件，获取其 children 也就是返回值；useState 的调用请见：[[React 中 useState 原理]]

接着判断，如果执行函数组件的过程中（也就是 render 过程中）发生了更新(比如直接执行 setState) 那么就会循环执行该函数组件，直到没有在 render 阶段中触发更新；或者直到循环次数超过 25 次，那么就会认为该组件陷入了死循环，抛出错误；

接着将 hooks 的上下文修改为抛出错误的 hook，这就是为什么在函数组件外使用 hook 将会报错；

接着判断函数组件内部 Hook 是否变少了，详情请见：[[Fiber 如何构建 Hook 链表？]]

最后就返回 children

整体还是很简单的；