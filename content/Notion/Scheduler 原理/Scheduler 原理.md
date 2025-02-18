---
title: Scheduler 原理
description: "react scheduler 源码解释"
tags:
- 开发
- 前端
- react
- 源码
created_at: 2025-01-22 22:11
filename: parse-react-scheduler.mdx
share: true
---

参考：

1. [https://github.com/lizuncong/mini-react](https://github.com/lizuncong/mini-react)

## scheduleCallback 用于生成 task，并且区分 task 分别压入 taskQueue 或 timerQueue 并安排宏任务

```js
// 位于 scheduler/src/forks/Scheduler.js 代码有所精简
function unstable_scheduleCallback(priorityLevel, callback, options) {
	// currentTime 优先使用 performance.now() 然后才是 Date.now()
  var currentTime = getCurrentTime();
  var startTime;
  if (typeof options === 'object' && options !== null) {
    var delay = options.delay;
    // 如果设置了 delay 表示是延迟任务，所以 startTime = currentTime + delay
    if (typeof delay === 'number' && delay > 0) {
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
  } else {
    startTime = currentTime;
  }

  var timeout;
  // 根据优先级获取过期的时间
  switch (priorityLevel) {
    case ImmediatePriority:
	    // 值为 -1 立即过期
      timeout = IMMEDIATE_PRIORITY_TIMEOUT;
      break;
    case UserBlockingPriority:
	    // 值为 250 表示 250ms 后过期
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
      break;
    case IdlePriority:
	    // 值为 2**31 - 1 永不过期
      timeout = IDLE_PRIORITY_TIMEOUT;
      break;
    case LowPriority:
	    // 值为 10000
      timeout = LOW_PRIORITY_TIMEOUT;
      break;
    case NormalPriority:
    default:
	    // 值为 5000
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
  }

	// 过期时间为 startTime + timeout
  var expirationTime = startTime + timeout;

	// 任务
  var newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,// 用于在最小堆中进行排序
  };

	// 开始时间大于现在时间，说明有延时
  if (startTime > currentTime) {
    // This is a delayed task.
    // 延时任务使用 startTime 进行排序
    newTask.sortIndex = startTime;
    // 延时的任务一律放到 timeQueue 这个最小堆里面去
    push(timerQueue, newTask);
   
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      // All tasks are delayed, and this is the task with the earliest delay.
      // 如果 taskQueue 里的任务都被执行完了，并且 timerQueue 的堆顶为 newTask 说明这个新任务是目前 timerQueue 最先执行的
      if (isHostTimeoutScheduled) {
	      // 那么如果有 timeout 任务被安排了，就取消这个安排，因为 newTask 目前是最先的
        // Cancel an existing timeout.
        cancelHostTimeout();
      } else {
	      // 否则就修改 isHostTimeoutScheduled 为 true 表示有 timeout 任务被安排了
        isHostTimeoutScheduled = true;
      }
      // 重新注册一个 timeout 安排；将会去注册一个 setTimeout 后续将会进行解释
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
	  // 进入这个 else 说明 newTask 不是延迟任务
	  // 常规任务使用 过期时间 作为排序标准
    newTask.sortIndex = expirationTime;
    // 常规任务放到 taskQueue 这个最小堆中
    push(taskQueue, newTask);
    // Schedule a host callback, if needed. If we're already performing work,
    // wait until the next time we yield.
    if (!isHostCallbackScheduled && !isPerformingWork) {
			// 如果没有 callback 被安排 并且 没有正在执行 work 
			// 那么就将 isHostCallbackScheduled 设置为 true 表示已经有 callback 被安排了
      isHostCallbackScheduled = true;
      // 使用 requestHostCallback 注册一个 hostCallback 安排，将会去触发对应的宏任务
      requestHostCallback(flushWork);
    }
  }

  return newTask;
}
```

> [!important]+ 重点：
> 
> 1. scheduleCallback 这个函数其实就是创建一个 task 然后根据是否时延时任务放到不同的堆中；
> 2. 任务分为常规任务和延迟任务两种；延迟任务就是设置了 delay 的任务；
> 3. 常规任务被放在 taskQueue 里面，延迟任务被放在 timerQueue 里面；这两个 queue 都是最小堆
> 4. 常规任务使用 expirationTime 作为排序标准，所以最先过期的在堆顶；延迟任务使用 startTime 作为排序标准呢 ，所以最先开始的在堆顶；
> 5. 根据优先级有五种过期时间，具体的在代码中；
> 6. 使用 requestHostCallback 将会去触发宏任务（一般来说是 portMessage）所以需要在一定条件下才能去调用该函数，如果每次都去调用的话，那么宏任务队列将会有很多，并且浏览器的绘制也是宏任务，如果浏览器的绘制排在了这些任务后面，那么也会导致浏览器绘制卡顿；
> 7. requestHostTimeout 可以取消，因为它内部使用的是 setTimeout
> 
> ---
> 
> Q: 为什么只有 taskQueue 为空时，才会去执行 requestHostTimeout 注册一个 timeout？
> 
> A: 这个问题在 workLoop 和 requestHostTimeout 代码中得到了解释；因为 requestHostTimeout 函数其实就是注册了一个 timeout 将 timerQueue 中的延时任务放到 taskQueue 中去；而 workLoop 中本身就会去做这些操作；那么如果 taskQueue 有任务，就一定会去注册宏任务执行 workLoop，执行 workLoop 就会去管理 timerQueue，所以 taskQueue 有值时不需要注册 timeout；

```ts
// 位于 scheduler/src/forks/Scheduler.js 代码有所精简
function requestHostCallback(callback) {
	// 为全局变量 scheduledHostCallback 赋值，其实这里的 callback 就是 flushWork
	// 这一行在 reactv19 中已经删除了，后续直接执行 flushWork
  scheduledHostCallback = callback;
  // 为了避免多次注册宏任务，这里又做了一次判断
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    // 使用 schedulePerformWorkUntilDeadline 注册宏任务；
    schedulePerformWorkUntilDeadline();
  }
}
```

```ts
// 位于 scheduler/src/forks/Scheduler.js 代码有所精简
// 为了更好理解，这里的顺序做了更改，应该 performWorkUntilDeadline 函数声明在上面

let schedulePerformWorkUntilDeadline;// requestHostCallback 调用的函数，也是一个全局变量
// 下面的判断总结一下其实就是：setImmediate > MessageChannel > setTimeout;
// setImmediate 可以理解为 0ms 的 setTimeout，真正的 0ms 的 setTimeout 一般用于 Node.js 或者 IE；在浏览器上可以忽略
// setTimeout 因为有着嵌套超过五层，浏览器强制执行 4ms 的最小延时的规定，所以是备选
if (typeof localSetImmediate === 'function') {
  schedulePerformWorkUntilDeadline = () => {
    localSetImmediate(performWorkUntilDeadline);
  };
} else if (typeof MessageChannel !== 'undefined') {
	// 所以重点就是这里：执行 schedulePerformWorkUntilDeadline 就会去向 channel 发送一个信号，然后就会触发 performWorkUntilDeadline
  const channel = new MessageChannel();
  const port = channel.port2;
  channel.port1.onmessage = performWorkUntilDeadline;
  schedulePerformWorkUntilDeadline = () => {
    port.postMessage(null);
  };
} else {
  schedulePerformWorkUntilDeadline = () => {
    localSetTimeout(performWorkUntilDeadline, 0);
  };
}

const performWorkUntilDeadline = () => {
	// scheduledHostCallback 就是在 requestHostCallback 中赋值的全局变量，可以就直接理解为 flushWork | null
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();
    // Keep track of the start time so we can measure how long the main thread has been blocked. 跟踪开始时间，以便我们可以测量主线程被阻塞的时间。
    startTime = currentTime;// 这里的 startTime 将会在 shouldYieldToHost 中使用，用于判断是否需要交出控制权给浏览器
    const hasTimeRemaining = true;
    let hasMoreWork = true;
    try {
	    // 是否还有任务未完成
      hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
    } finally {
      if (hasMoreWork) {
        // 如果还有任务没有完成，就交给下一次宏任务，这样就可以让 浏览器绘制 与 安排的任务交替进行；
        schedulePerformWorkUntilDeadline();
      } else {
	      // 如果没有新的任务，则重置全局变量；
        isMessageLoopRunning = false;
        scheduledHostCallback = null;
      }
    }
  } else {
	  // 没有任务 重置全局变量
    isMessageLoopRunning = false;
  }
};
```

> [!important]
> 
> 1. [https://developer.mozilla.org/zh-CN/docs/Web/API/Window/setTimeout#%E5%BB%B6%E6%97%B6%E6%AF%94%E6%8C%87%E5%AE%9A%E5%80%BC%E6%9B%B4%E9%95%BF%E7%9A%84%E5%8E%9F%E5%9B%A0](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/setTimeout#%E5%BB%B6%E6%97%B6%E6%AF%94%E6%8C%87%E5%AE%9A%E5%80%BC%E6%9B%B4%E9%95%BF%E7%9A%84%E5%8E%9F%E5%9B%A0) setTimeout 延时比指定值更长的原因
> 2. scheduledHostCallback 其实就是 flushWork ，在 reactv19 中直接去掉了 scheduledHostCallback 这个全局变量，直接执行 flushWork

```ts
// 位于 scheduler/src/forks/Scheduler.js 代码有所精简
// flushWork 就是 scheduleCallback 中使用 requestHostCallback 注册的
// 在 performWorkUntilDeadline 可以看到两个参数，分别是 true 和执行 flushWork 时的时间；
function flushWork(hasTimeRemaining, initialTime) {
  // 开始对安排的任务进行处理，将 isHostCallbackScheduled 设置为 false，不再是安排，而是在处理了
  isHostCallbackScheduled = false;
  if (isHostTimeoutScheduled) {
	  // TODO 如果安排了 timeout 那么取消掉它； 为什么？ 在处理过程中会对 timerQueue 进行处理吗？ 
    isHostTimeoutScheduled = false;
    cancelHostTimeout();
  }

	// 将 isPerformingWork 设置为 true 表示正在处理
  isPerformingWork = true;
  const previousPriorityLevel = currentPriorityLevel;
  try {
    // 进入 workLoop 正式开始处理安排的任务
    return workLoop(hasTimeRemaining, initialTime);
  } finally {
	  // 这个 try 的重点是这里的 finally 重置全局变量
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }
}
```

> [!important]
> 
> 1. flushWork 的第一个参数在 React v19 之前始终为 true。并且在 React v19 中已删除了第一个参数，只保留了第二个参数（即执行 flushWork 时的时间）
> 2. flushWork 的参数同样传递给了 workLoop
> 3. flushWork 这个函数的作用简单的理解就是为了执行 workLoop
> 
> ---
> 
> Q：如果安排了 timeout 那么取消掉它，这是为什么？ 在处理过程中会对 timerQueue 进行处理吗？
> 
> A：是的在 workLoop 中将会使用 advanceTimers 去处理 timerQueue

```ts
// 位于 scheduler/src/forks/Scheduler.js 代码有所精简
// 第一个参数一直为 true，第二个参数是执行 flushWork 时的时间
function workLoop(hasTimeRemaining, initialTime) {
  let currentTime = initialTime;
  // 这一步将会去检查 timerQueue 中是否有可以开始执行的任务，即 timerTask.startTime <= currentTime 如果有可以执行的任务，那么就把它拿出来，放到 taskQueue 中去；
  advanceTimers(currentTime);
  // 获取 taskQueue 堆顶的任务，这里 peek 只是获取不是弹出
  currentTask = peek(taskQueue);
  while (currentTask !== null) {// 如果 currentTask 不为空则进入循环
    if (
      currentTask.expirationTime > currentTime &&
      (!hasTimeRemaining || shouldYieldToHost())// shouldYieldToHost 函数会去判断是否需要将控制权交给浏览器，相当于限制了每次 flushWork 只能执行 5ms 超过就必须将控制权还给浏览器
    ) {
	    // 当任务还没有过期，并且需要将控制权交给浏览器时，跳出循环；
	    // 过期的优先级更高，如果过期了，那么无论如何也会处理该任务
      break;
    }
    const callback = currentTask.callback;
    if (typeof callback === 'function') {
	    // 这里直接将任务中的 callback 设置为 null；因为任务处理完成，重置为 null
      currentTask.callback = null;
      // TODO
      currentPriorityLevel = currentTask.priorityLevel;
      // 判断当前的任务是否过期
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
    
	    // 执行 callback 传递，参数就是 didTimeout 是否过期；如果有返回值，说明该任务还未完成；这就是任务切片；
      const continuationCallback = callback(didUserCallbackTimeout);
      // callback 执行完后更新时间；
      currentTime = getCurrentTime();
      // 如果返回值为函数，说明该任务还未结束；
      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback;
      } else {
	      // 如果没有值，那么说明该任务已经完成了；这里的判断为了避免在 callback 执行过程中，注册了更高优先级的任务，那么新任务就会在堆顶，所以不能无脑弹出；
	      // 如果有新任务在堆顶，就不做任何处理，这样不会有问题，即使遍历到了那个任务，因为 callback 为 null 也会直接跳过；
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
      }
      // 再次检查 timerQueue
      advanceTimers(currentTime);
    } else {
	    // callbcak 不为 function 直接弹出
      pop(taskQueue);
    }
    // 更新 currentTask
    currentTask = peek(taskQueue);
  }
  
  // 如果 currentTask 不为 null 那么说明还有任务，所以返回 true 表示还有任务
  if (currentTask !== null) {
    return true;
  } else {
    const firstTimer = peek(timerQueue);
    if (firstTimer !== null) {
	    // 如果 timerQueue 里面还有延时任务，那么注册一个 timeout；
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    // 返回 false 表示没有现在就需要的任务；
    return false;
  }
}
```

> [!important]
> 
> 1. workLoop 这个函数简单的来说就是用来执行任务的，执行任务前后都会去处理 timerQueue；
> 2. shouldYieldToHost 这个函数其实就是限制了每次 flushWork 不能超过 5ms ；它会使用最新事件 - startTime，这个 startTime 就是在 performWorkUntilDeadline 中执行 flushWork 前进行赋值；

### unstable_cancelCallback 用于取消 task

```undefined
// 位于 scheduler/src/forks/Scheduler.js 代码有所精简
function unstable_cancelCallback(task) {
  // 取消 task 其实很简单，在上面的 workLoop 中已经见到了，就是将 callback 设置为 null
  // 遇到 callback 为 null 时，直接跳过
  task.callback = null;
}
```

## TimerQueue 延迟任务

### requestHostTimeout 用于注册一个 setTimeout 管理 timerQueue

```ts
// 位于 scheduler/src/forks/Scheduler.js 代码有所精简
// 第一个参数一般都是 handleTimeout，第二个参数就是 任务的开始时间 - 当前时间，也就是中间的差值
function requestHostTimeout(callback, ms) {
	// 注意 taskTimeoutID 是一个全局变量，这意味着， scheduler 中只使用一个 setTimeout 管理，不会去注册更多的 setTimeout 这也是一种性能优化；
  taskTimeoutID = localSetTimeout(() => {// localSetTimeout 直接看做 setTimeout 即可
    callback(getCurrentTime());
  }, ms);// ms 时间后，刚好到延时任务的开始时间
}
```

> [!important]
> 
> 1. taskTimeoutID 是一个全局变量，这意味着 scheduler 中只使用一个 setTimeout 管理，不会去注册更多的 setTimeout ，这也是一种性能优化；

### handleTimeout 处理 timerQueue 并重新安排 task 或 timer

```ts
// 位于 scheduler/src/forks/Scheduler.js 代码有所精简
function handleTimeout(currentTime) {
  isHostTimeoutScheduled = false;
  // 处理 timerQueue
  advanceTimers(currentTime);

  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
	    // 只要有任务，就要把它安排上
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    } else {
		  // 没有 task 那么就继续等待 延迟任务；
      const firstTimer = peek(timerQueue);
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}
```

### advanceTimers 处理 timerQueue 将过期的 timer 放到 taskQueue

```js
// 位于 scheduler/src/forks/Scheduler.js 代码有所精简
function advanceTimers(currentTime) {
  // Check for tasks that are no longer delayed and add them to the queue.
  // 拿到堆顶的 timer 也就是最早过期的 timer
  let timer = peek(timerQueue);
  // 循环检查，直到没有 timer 或者 timer 还没到时间
  while (timer !== null) {
    // callback 为 null 说明被取消了
    if (timer.callback === null) {
      // Timer was cancelled.
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      // Timer fired. Transfer to the task queue.
      pop(timerQueue);
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
    } else {
      // Remaining timers are pending.
      return;
    }
    timer = peek(timerQueue);
  }
}
```

### cancelHostTimeout 取消用于处理 timerQueue 的 setTimeout

```ts
function cancelHostTimeout() {
  localClearTimeout(taskTimeoutID);// localClearTimeout 直接理解为 clearTimeout 即可
  taskTimeoutID = -1;
}
```

---

  

[https://www.processon.com/diagraming/6772bf173df84d14924a8992](https://www.processon.com/diagraming/6772bf173df84d14924a8992)

![[react_scheduler.png]]