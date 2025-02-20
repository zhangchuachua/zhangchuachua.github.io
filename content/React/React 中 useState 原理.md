---
title: useState 原理
description: React Hooks 中最核心的就是 useState 或者说是 useReducer 因为， useState 就是 useReducer 的变体。因为 useState 几乎是用的最多的 Hook 让我们来详细看一下 useState 的原理。
tags:
- react
- sourcecode
create_date: 2025-02-20 14:17
slug: render-with-hooks
---

首先要知道一点： Hooks 在挂载时和更新时执行的函数是不一样的

## 组件第一次渲染时

第一次渲染的时候执行的是 mountState, 部分代码如下所示：

```flow js title="react-reconciler/src/ReactFiberHooks.js"
function mountState<S>(
    initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
   // !创建一个 Hook 对象，每一个 Hook 都有一个 Hook 对象；然后所有的 Hook 对象将会连接成一个链表，存放在 fiber 的 memoizedState 上
   const hook = mountWorkInProgressHook();
   // 如果是个函数，就执行函数获取初始值
   if (typeof initialState === 'function') {
      initialState = initialState();
   }
   // *fiber 上有一个 memoizedState 属性，存储 Hook 对象；然后每个 Hook 对象也有一个 memoizedState 属性，不要混淆。 useState 的 memoizedState 存储的是 state 值；
   hook.memoizedState = hook.baseState = initialState;
   // queue 用于存储当前这个 Hook 触发的更新任务； 在 update 时会用到；
   const queue: UpdateQueue<S, BasicStateAction<S>> = {
      pending: null,
      interleaved: null,
      lanes: NoLanes,
      dispatch: null,
      lastRenderedReducer: basicStateReducer,
      lastRenderedState: (initialState: any),
   };
   hook.queue = queue;
   // *注意 dispatch 已经 bind 了两个参数，所以 dispatch 的时候可以直接使用这两个参数
   const dispatch: Dispatch<BasicStateAction<S>,> = (queue.dispatch = (dispatchSetState.bind(
       null,
       currentlyRenderingFiber,
       queue,
   ): any));
   // 返回即可
   return [hook.memoizedState, dispatch];
}
```

> [!important]- 主要所做的内容
> 1. 创建 Hook 对象；组成 Hook 对象链表；fiber.memoizedState 指向 Hook 对象链表；详细请看 [[Fiber 如何构建 Hook 链表？]]
> 2. 获取初始值，复制给 Hook 对象的 memoizedState
> 3. 创建 queue 用于存储更新对象
> 4. 初始化 dispatch
> 5. 返回 [初始值, dispatch]

## 触发更新时

从上面的部分知道了 setXXX 这个函数其实就是 dispatch; 所以下面是 dispatch 的部分代码:

```flow js title="react-reconciler/src/ReactFiberHooks.js"
function dispatchSetState<S, A>(
    fiber: Fiber,
    queue: UpdateQueue<S, A>,
    action: A,
) {
   // 请求优先级；
   const lane = requestUpdateLane(fiber);

   // 触发更新自然创建一个 更新 对象
   const update: Update<S, A> = {
      lane,
      action,
      hasEagerState: false,
      eagerState: null,
      next: (null: any),
   };

   if (isRenderPhaseUpdate(fiber)) {
      // ...忽略代码;
      // 判断是不是在 渲染阶段 发生的更新，如果是渲染阶段发生的更新，此次不会进行处理，而是将 update 放到 queue.pending 中，后面进行处理;
      // 很少遇到这个情况，忽略；渲染阶段更新就是这个组件在执行 renderWithHooks 的时候触发了更新；
   } else {
      const alternate = fiber.alternate;
      if (
          fiber.lanes === NoLanes &&
          (alternate === null || alternate.lanes === NoLanes)
      ) {
         // *如果当前 fiber 和 alternate 没有优先级，那么就说明没有待处理的任务，那么就有时间去计算下一个 state，如果新的 state 与当前的 state 相同，就可以先跳过；优化性能
         // ...忽略代码;
         // 判断新值与旧值是否相同；如果相同则跳过；
         if (is(eagerState, currentState)) {
            enqueueConcurrentHookUpdateAndEagerlyBailout(
                fiber,
                queue,
                update,
                lane,
            );
            return;
         }
         // ...忽略代码;
      }

      //
      const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
      if (root !== null) {
         const eventTime = requestEventTime();
         scheduleUpdateOnFiber(root, fiber, lane, eventTime);
         entangleTransitionUpdate(root, queue, lane);
      }
   }

   markUpdateInDevTools(fiber, lane, action);
}
```



3. 更新时执行的是 updateReducer (useState 就是 useReducer 的变体)
    1. 首先去获取这个 hook 对应的 Hook 对象；
    2. 然后将需要更新的内容拼接成一个循环链表；
    3. 然后遍历链表，进行更新，将更新的 state 值存储到 hook.memoizedState 上；
    4. 然后比较上一次的值，如果不一样，则需要进行更新，否则没有改动；
    5. 返回一个数组；