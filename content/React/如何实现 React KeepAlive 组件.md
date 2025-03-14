---
title: 如何实现 React KeepAlive 组件
description: 实现 React KeepAlive 组件
tags:
- 前端
- react
create_date: 2025-03-13 15:01
slug: how-to-create-keep-alive-in-react
---

## 组件描述

KeepAlive 组件主要用于存储 DOM 的状态，比如在一个 input 中输入了部分内容，希望在路由切换或是 tab 切换后仍保存状态，当再次回到这个 input 时，input 中的内容不变。

在 Vue 中官方提供了这个[组件](https://cn.vuejs.org/guide/built-ins/keep-alive)，React 是没有的。

React 可以通过其他的方式实现类似的效果，但是不可能达到 Vue 的那样的效果，因为 Vue 源码中就对 KeepAlive 有特殊的处理。

## 实现思路

要想保存状态，首先要知道状态是存在哪里的，react 中组件的状态都存储在 fiber 中，所以思路有以下几种：

1. 卸载组件，但是将 fiber 保存在内存中，这个方案只有修改源码才能做，实际开发中是接触不到 fiber 的，并且也不能随意操作 fiber 容易引起错误。
2. 不卸载组件，那么组件内的数据自然也就保存下来了
3. 卸载组件，卸载之前将数据保存，重新挂载组件的时候使用之前的数据初始化。

### 第二种方法

怎么样才能既不卸载组件，又不让组件的 DOM 元素造成其他影响呢？

> [!tip]- 可能造成的影响
> DOM 如果保留在原来的位置，即使使用 `display: none` 把它从渲染流程中删除，依然会造成一定的影响，比如说：
> 
> ```jsx
> <div className="first:c-red">
> 	<div style={{display: 'none'}}>123</div>
> 	<div>123</div>
> </div>
> ```
> 
> 上述代码中，虽然第一个 div 为 `display: none` 但是依然会影响 css ，它还是第一个 child。

可以使用 createPortal, 把组件渲染到指定的地方即可

> [!tip]- 注意
> createPortal 如果把组件渲染到一个没有在文档流中的 DOM 中的话，也不会卸载组件，例如:
> 
> ```js
> const element = useMemo(() => { return document.createElement('div') }, []);
> return createPortal(children, element);
> ```
> 
> 上述代码中，element 是在内存中的 DOM 元素，把组件放到 element 依然会保留组件的状态；

以下是最基本的示例代码，其他的需求需要额外添加。

```jsx
import { useRef, useMemo, useLayoutEffect, } from "react";  
import { createPortal } from "react-dom";  
  
// 最基础的 KeepAlive 组件，用于理清 KeepAlive 的工作原理  
function KeepAlive({ children, activeCacheKey: cacheKey }) {  
  const containerRef = useRef(null);  
  const cacheMap = useRef(new Map);  
  // 每次都存入最新的 children ，这样如果组件发生了变化，那么也可以第一时间更新  
  cacheMap.current.set(cacheKey, children);  
  const cacheList = [...cacheMap.current.entries()]  
  
  return <>  
    <div ref={containerRef}/>  
    {  
      cacheList.map(([key, children]) => {  
        // 总是渲染所有的 children，由 KeepAliveScope 决定把 children 渲染到哪里  
        return <KeepAliveScope key={key} cacheMap={cacheMap} active={key === cacheKey} cacheKey={key}  
                               containerRef={containerRef}>{children}</KeepAliveScope>  
      })  
    }  
  </>  
}  
  
function KeepAliveScope({ children, active, containerRef, cacheKey }) {  
  // *创建一个在内存中的 div  const cacheContainer = useMemo(() => {  
    const temp = document.createElement('div');  
    temp.setAttribute('data-cache-key', cacheKey);  
    return temp;  
  }, [cacheKey]);  
  
  useLayoutEffect(() => {  
    if (!containerRef.current) throw new Error('containerRef is null');  
    if (active) {  
      let first = containerRef.current.firstChild;  
      while (first) {  
        containerRef.current.removeChild(first);  
        first = containerRef.current.firstChild;  
      }  
      containerRef.current.appendChild(cacheContainer);  
    }  
  }, [active, cacheContainer, containerRef]);  
  
  // *把 children 渲染到 cacheContainer 中，这个 Portal 组件依然被 react 管理，后续的 fiber 化不会受到影响  
  return createPortal(children, cacheContainer, cacheKey);  
}  
  
export { KeepAlive };
```

### 第三种方法

存储组件的数据，需要按照具体的业务逻辑进行处理了，所以这里不进行实现。