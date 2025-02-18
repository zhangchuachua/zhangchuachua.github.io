---
title: Hook 对象
description: 详细解释 Hook 对象
tags:
- 开发
- 前端
- react
- 源码
create_date: 2025-02-09 01:48
filename: react-hook-object.mdx
share: true
---

常用的 hook(除了 useContext) 都有一个 Hook 对象，类型大概是这样的：

```js
const hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };
```

不同的 hook 使用 Hook 对象的存储的值是不同的，下面是分别的介绍；(来自于 GPT)

### **1. 使用** `**useState**`

```js
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => setCount(prevCount => prevCount + 1);

  return (
    <div>
      <p>Current Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

**Hook 对象分析：**

- `**memoizedState**`: 存储当前的 `count` 值。例如，初始值为 `0`，每次点击按钮后会更新为新的值。
- `**baseState**`: 记录上一次渲染完成后的 `count` 值。用于在批量更新时作为计算基础。
- `**baseQueue**`: 保存所有待处理的状态更新队列。在本例中，每次 `setCount` 调用都会将更新操作添加到 `baseQueue` 中。
- `**queue**`: 当前渲染周期内的更新队列。React 会将 `baseQueue` 中的所有更新应用到 `baseState`，然后更新 `memoizedState`。
- `**next**`: 指向下一个 Hook 对象，形成一个链表结构，用于在组件渲染期间依次处理每个 Hook。

**工作流程示例：**

1. **初始渲染**：
    - `memoizedState` = `0`
    - `baseState` = `0`
    - `baseQueue` = `null`
    - `queue` = `null`
2. **第一次点击按钮 (**`**setCount(prevCount => prevCount + 1)**`**)**：
    - `baseQueue` 接收到一个更新操作 (`prevCount + 1`)
    - React 把这个更新添加到 `queue` 中
    - 在下一次渲染时，`baseState` = `0`，应用更新后 `memoizedState` = `1`
3. **第二次点击按钮**：
    - 类似地，`memoizedState` 从 `1` 更新到 `2`

### **2. 使用** `**useReducer**`

```js
import React, { useReducer } from 'react';

const initialState = { count: 0 };

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <p>Current Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>Increment</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>Decrement</button>
    </div>
  );
}
```

**Hook 对象分析：**

- `**memoizedState**`: 存储当前的 `state` 对象。例如，初始为 `{ count: 0 }`，每次分发 (`dispatch`) 动作后会更新为新的状态。
- `**baseState**`: 记录上一次渲染完成后的 `state`，作为计算新状态的基础。
- `**baseQueue**`: 保存所有待处理的动作队列 (`action queue`)。每次调用 `dispatch` 都会将动作添加到 `baseQueue` 中。
- `**queue**`: 当前渲染周期内的动作队列。React 会将 `baseQueue` 中的所有动作应用到 `baseState`，然后更新 `memoizedState`。
- `**next**`: 指向下一个 Hook 对象，形成链表结构。

**工作流程示例：**

4. **初始渲染**：
    - `memoizedState` = `{ count: 0 }`
    - `baseState` = `{ count: 0 }`
    - `baseQueue` = `null`
    - `queue` = `null`
5. **点击 "Increment" 按钮 (**`**dispatch({ type: 'increment' })**`**)**：
    - 将 `{ type: 'increment' }` 添加到 `baseQueue`
    - 在下一次渲染时，`baseState` = `{ count: 0 }`，应用动作后 `memoizedState` = `{ count: 1 }`
6. **点击 "Decrement" 按钮 (**`**dispatch({ type: 'decrement' })**`**)**：
    - 将 `{ type: 'decrement' }` 添加到 `baseQueue`
    - 在下一次渲染时，`baseState` = `{ count: 1 }`，应用动作后 `memoizedState` = `{ count: 0 }`

### **3. 使用** `**useMemo**`

```js
import React, { useMemo, useState } from 'react';

function ExpensiveComponent({ a, b }) {
  const expensiveValue = useMemo(() => {
    // 模拟高耗性能计算
    let total = 0;
    for (let i = 0; i < 1000000; i++) {
      total += a + b;
    }
    return total;
  }, [a, b]);

  return <div>Expensive Value: {expensiveValue}</div>;
}
```

**Hook 对象分析：**

- `**memoizedState**`: 存储计算后的 `expensiveValue`。如果依赖项 `[a, b]` 没有变化，则复用之前的值，避免重新计算。
- `**baseState**`: 不被 `useMemo` 使用。
- `**baseQueue**`: 不被 `useMemo` 使用。
- `**queue**`: 不被 `useMemo` 使用。
- `**next**`: 指向下一个 Hook 对象，形成链表结构。

**工作流程示例：**

7. **初始渲染**：
    - 计算并存储 `expensiveValue` 到 `memoizedState`
8. **当** `**a**` **或** `**b**` **发生变化时**：
    - 重新计算 `expensiveValue` 并更新 `memoizedState`
9. **当** `**a**` **和** `**b**` **都未变化时**：
    - 复用 `memoizedState` 中已有的 `expensiveValue`

### **4. 使用** `**useCallback**`

```js
import React, { useState, useCallback } from 'react';

function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}

function Parent() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <Button onClick={increment}>Increment</Button>
    </div>
  );
}
```

**Hook 对象分析：**

- `**memoizedState**`: 存储缓存的 `increment` 函数。如果依赖项数组 `[]` 没有变化，复用之前的函数引用，避免不必要的重新渲染。
- `**baseState**`: 不被 `useCallback` 使用。
- `**baseQueue**`: 不被 `useCallback` 使用。
- `**queue**`: 不被 `useCallback` 使用。
- `**next**`: 指向下一个 Hook 对象，形成链表结构。

**工作流程示例：**

10. **初始渲染**：
    - 创建并存储 `increment` 函数到 `memoizedState`
11. **当组件重新渲染且依赖项未变化时**：
    - 复用 `memoizedState` 中已有的 `increment` 函数
    - 避免子组件 `Button` 因 `onClick` 函数引用变化而重新渲染
12. **如果依赖项数组中有变化的值**：
    - 重新创建 `increment` 函数并更新 `memoizedState`

### **5. 使用** `**useRef**`

```js
import React, { useRef, useEffect } from 'react';

function TextInput() {
  const inputRef = useRef(null);

  useEffect(() => {
    // 聚焦输入框
    inputRef.current.focus();
  }, []);

  return <input ref={inputRef} type="text" />;
}
```

**Hook 对象分析：**

- `**memoizedState**`: 存储 `ref` 对象 `{ current: null }`，在组件挂载后更新为实际的 DOM 节点引用。
- `**baseState**`: 不被 `useRef` 使用。
- `**baseQueue**`: 不被 `useRef` 使用。
- `**queue**`: 不被 `useRef` 使用。
- `**next**`: 指向下一个 Hook 对象，形成链表结构。

**工作流程示例：**

13. **初始渲染**：
    - 创建 `inputRef` 对象 `{ current: null }`，存储在 `memoizedState`
14. **组件挂载后**：
    - `inputRef.current` 被赋值为实际的输入框 DOM 节点
    - 允许在 `useEffect` 中访问和操作该 DOM 节点，例如调用 `focus()`
15. **后续渲染**：
    - 复用同一个 `inputRef` 对象，保持对 DOM 节点的引用不变

### 6. useEffect, useLayoutEffect, useImperativeHandle

```js
function TextInput() {
	const [count, setCount] = useState(0);

  useEffect(() => {
	  const timeId = setInterval(() => {
		  setCount((prev) => prev+1);
	  }, 1000);
	  return () => {
		  clearInterval(timeId)
		  ;
	  }
  }, []);

  return <div>{count}</div>
}
```

Hook 对象分析：

- `**memoizedState**` **存储一个 effect 对象，effect 对象保存的是 hook 的状态信息，比如监听函数，以来，清除函数等；**
    
    ```js
    const effect: Effect = {
      tag: tag, // effect的类型，useEffect对应的tag为5，useLayoutEffect对应的tag为3
      create: create, // useEffect或者useLayoutEffect的监听函数，即第一个参数
      destroy: destroy, // useEffect或者useLayoutEffect的清除函数，即监听函数的返回值
      deps: deps, // useEffect或者useLayoutEffect的依赖，第二个参数
      // Circular
      next: null, // 在updateQueue中使用，将所有的effect连成一个链表
    }
    ```
    
- next: 指向下一个 Hook 对象；
- 其他的不使用；

### **总结**

通过上述示例，可以看到不同类型的 Hook 如何利用 Hook 对象的各个字段来管理状态和优化性能：

- `**useState**` **和** `**useReducer**`：主要使用 `memoizedState`, `baseState`, `baseQueue`, 和 `queue` 来处理状态和更新队列。
- `**useMemo**` **和** `**useCallback**`：主要使用 `memoizedState` 来缓存计算结果或函数，避免不必要的重新计算或重建。
- `**useRef**`：主要使用 `memoizedState` 来存储对 DOM 节点或其他可变对象的引用。

这些内部机制使得 React 能够高效地管理组件的状态和生命周期，同时提供开发者友好的 API 来构建复杂的用户界面。