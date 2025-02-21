---
title: useState 原理
description: React Hooks 中最核心的就是 useState 或者说是 useReducer 因为， useState 就是 useReducer 的变体。因为 useState 几乎是用的最多的 Hook 让我们来详细看一下 useState 的原理。
tags:
- react
- sourcecode
create_date: 2025-02-20 14:17
slug: parse-use-state
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
      next: (null: any),// 链表连接
   };

   if (isRenderPhaseUpdate(fiber)) {
      // ...忽略代码;
      // 判断是不是在 渲染阶段 发生的更新，如果是渲染阶段发生的更新，此次不会进行处理，而是将 update 放到 queue.pending 中，后面进行处理;
      // 渲染阶段更新就是这个组件在执行 renderWithHooks 的时候触发了更新；例如：在组件内部直接 setState。这样主要是为了 1. 避免无限循环 2. 合并更新，优化性能
   } else {
      const alternate = fiber.alternate;
      if (
          fiber.lanes === NoLanes &&
          (alternate === null || alternate.lanes === NoLanes)
      ) {
         // *如果当前 fiber 和 alternate 没有优先级，那么就说明没有待处理的任务，那么就有时间去计算下一个 state，如果新的 state 与当前的 state 相同，就可以先跳过；优化性能
         // ...忽略代码;
         // 判断新值与旧值是否相同（这个 is 就可以看作是 Object.js）；如果相同则跳过；
         if (is(eagerState, currentState)) {
           // 这个函数主要的内容是吧 update 对象放到 queue.interleaved 里面去; 注意 queue.interleaved 也是一个链表，一个 Update 对象链表
           // *注意，这次 update 虽然跳过了渲染，但是依然会把 update 对象放到 queue.interleaved 里面去；可能是为了保证更新的顺序和一致性，后面也可能会用到
           // concurrent 模式下，会讲 queue 放到 concurrentQueues 这个全局变量去(是一个数组)；然后在某个阶段，会遍历数组，吧 interleaved 里面的 update 放到 pending 中去；
            enqueueConcurrentHookUpdateAndEagerlyBailout(fiber, queue, update, lane);
            // 直接返回跳过调度渲染
            return;
         }
         // ...忽略代码;
      }
      // 如果已经有待更新的任务（比如第二次 setState 时），就不会进行计算;
      // 这个函数的内容与上面的 enqueueConcurrentHookUpdateAndEagerlyBailout 大致相同，都是把 Update 放到 queue.interleaved 里面去，连成链表；
      // *但是这个函数多了一步，会把 lane 一直向上传递，给所有祖先 fiber 的 childLanes 添加 lane；然后返回 HostRoot
      const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
      if (root !== null) {
         const eventTime = requestEventTime();
         // 调度这个更新；可以看调度章节；
         scheduleUpdateOnFiber(root, fiber, lane, eventTime);
         entangleTransitionUpdate(root, queue, lane);
      }
   }
   // ...忽略代码;
}
```

> [!important]- 主要所做的内容
> 1. 请求优先级 lane，创建 Update 对象
> 2. 把 Update 对象放到 queue.interleaved 里面去，连成链表
> 3. 调度更新(不一定发生调度)

## 更新时

更新时执行的是 updateReducer (useState 就是 useReducer 的变体)

```flow js title="react-reconciler/src/ReactFiberHooks.js"
function updateReducer<S, I, A>(
    reducer: (S, A) => S,
    initialArg: I,
    init?: I => S,
): [S, Dispatch<A>] {
   // *创建新的 Hook 对象，但是值还是之前的值；连接 Hook 链表； fiber.memoizedState 指向 Hook 链表；详细请看 [[Fiber 如何构建 Hook 链表？]]
   const hook = updateWorkInProgressHook();
   const queue = hook.queue;
   
   // ...忽略代码;

   const current: Hook = (currentHook: any);
  // 继续向下面看，发现 baseQueue 其实就是 pending 里面的内容
   let baseQueue = current.baseQueue;
   const pendingQueue = queue.pending;
   if (pendingQueue !== null) {
     // baseQueue 有值说明是上次未处理完成的任务；
      if (baseQueue !== null) {
        // ...忽略代码; 将 pendingQueue 和 baseQueue 合并成一个新的循环链表； firstNode 是 baseQueue 的第一个节点
      }
     // baseQueue 的内容其实就是 pending 的内容；
      current.baseQueue = baseQueue = pendingQueue;
     // 清空 pending
      queue.pending = null;
   }

   // 是否有任务待处理
   if (baseQueue !== null) {
      // ...省略初始化变量；
      do {
         const updateLane = update.lane;
        // 如果这个 Update 的 lane 不在 renderLanes 内，那么不处理这个更新；假设 renderLanes 是 SyncLane 那么可以理解为此次更新
        // 就是为处理同步更新的任务的，其他的任务都忽略；
         if (!isSubsetOfLanes(renderLanes, updateLane)) {
           // 克隆这个被跳过的 Update 对象，并连接成一个新的链表；
           // ...省略代码
           // 因为这个 Update 对象被跳过了，所以会更新当前 fiber.lanes 值为当前 Update 的 lane 值；期待下次更新; 并且标记此次跳过了 Update.lane
         } else {
           // *注意，当前 Update 对象虽然没有被跳过，将会发生处理，但是如果之前有被跳过的 Update，依然会克隆当前的 Update 并且连接在链表中；但是 lane 会复制为 NoLane 后续遇到也不会进行处理；
           // 这样操作的原因尚不清楚，根据 GPT 的回答是为了： 1. 维护更新链的完整性 2. 高优先级更新插队 3. 并发渲染的可中断与恢复。
            if (newBaseQueueLast !== null) {
               const clone: Update<S, A> = {
                  lane: NoLane, // *这里赋值为了 NoLane
                  action: update.action,
                  hasEagerState: update.hasEagerState,
                  eagerState: update.eagerState,
                  next: (null: any),
               };
               newBaseQueueLast = newBaseQueueLast.next = clone;
            }
            // 计算获取最新的值；
            if (update.hasEagerState) {
               newState = ((update.eagerState: any): S);
            } else {
               const action = update.action;
               newState = reducer(newState, action);
            }
         }
         update = update.next;
      } while (update !== null && update !== first);// 批量更改
      // ...省略代码
      if (!is(newState, hook.memoizedState)) {// 将最终的值与上次的值进行比较；如果不一样就标记当前的 wip 收到了更新；
         markWorkInProgressReceivedUpdate();
      }
      // 将结果存储到 hook 中；
      hook.memoizedState = newState; // useState 此次更新最新的值
     // baseState 与 memoizedState 是不一样的，假设有有三个 update [SyncLane +1, TranslateionLane, SyncLane +1] state 值为 1;
      // 最终结果是 memoizedState 为 3， baseState 值为 2 目前还是不太懂为什么要这样做；应该与上面 update 对象没有被跳过但是被克隆一样；
      hook.baseState = newBaseState; 
      hook.baseQueue = newBaseQueueLast;

      queue.lastRenderedState = newState;
   }

   const lastInterleaved = queue.interleaved;
   // ?什么情况下在 render 阶段中 interleaved 还是不为 null；但是可以理解不能在此次渲染中处理他们
   // 于是与上面的被跳过的 Update 一样，将 Update.lane 合并到 fiber.lanes 中期待下次处理； 并且标记此次跳过了 Update.lane
   if (lastInterleaved !== null) {
      // ...省略代码， 与上面差不多
   } else if (baseQueue === null) {
      // ...省略
   }
   const dispatch: Dispatch<A> = (queue.dispatch: any);
   return [hook.memoizedState, dispatch];
}
```

> [!important]- 主要所做的内容
> 1. 最重要的就是：遍历待更新的 Update 链表并 计算出最新的 state 值
> 2. 整理 pending 链表