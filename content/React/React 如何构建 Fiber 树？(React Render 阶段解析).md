---
title: React 如何构建 Fiber 树？(React Render 阶段解析)
description: React 在 Render 阶段如何构建 Fiber 树？在构建过程中还做了什么？请看解析
tags:
- react
- sourcecode
create_date: 2025-02-19 18:16
slug: react-how-to-build-fiber-tree
---

用于调试的 jsx：

```jsx
function Count() {  
  const [count, setCount] = useState(0);  
  const handleConcurrentClick = useCallback(() => {  
    setCount((prev) => prev + 1);  
    setCount((prev) => prev + 1);  
    setTimeout(() => {  
      setCount((prev) => prev + 2);  
      setCount((prev) => prev + 2);  
    })  
  }, []);  
  
  useEffect(() => {  
    console.log("effect 1");  
  }, [count]);  
  
  return <button onClick={handleConcurrentClick}>{count}</button>;  
}  
  
const Static = () => {  
  return 'static';  
}  
  
function App() {  
  return <>  
    <Count/>  
    <Static/>  
  </>;
}
```

> [!tip]- beginWork 和 componentWork 的执行顺序示例
> ```js
> while(wip) {
> 	beginWork(...)
> 	completeWork(...)
> }
> ```

## 第一次渲染

详细过程如下所示：

首先创建 FiberRootNode 和 HostRoot

![[create-fiberRootNode-and-HostRoot.png]] ^fc88ed

进入 Render 阶段，创建 workInProgress 和 workInProgressRoot 这两个全局变量

![[create-wip-and-wipRoot.png]]

开始执行 beginWork 进行处理，调和 children 连接 fiber 树; 第一个处理 HostRoot

![[beginwork-HostRoot.png]]

处理 App ，执行 App(执行 App )获取其 children ，然后调和 children 创建对应的 fiber 并且连接为 fiber 树。最终 wip 指向 Count 组件对应的 fiber 作为下一次处理的对象。

![[beginWork-App.png]]

beginWork 处理 Count

![[beginWork-Count.png]]

beginwork 处理 button

![[beginWork-button.png]]

> [!important]- completeWork 如何处理 未知组件、class 组件、函数组件、memo 组件、forwordRef、Fragment?
>  主要将子节点的 lane 和 flag 同步到当前 fiber 上
> 

> [!tip]- completeWork 如何处理 HostComponent
> HostComponent 也就是原生 html element
> 
> 挂载时：
> 1. 使用 createElement 创建 instance，并且把 fiber 对象和 props 都放到 instance 对象中；
> 2. 把 children 放到 instance 中，把 instance 放到 stateNode 中；并且遍历 props 将属性设置到 instance 中，也就是说此时的 instance 基本是个完全体了；
> 3. 把 children 的 lane 和 flag 放到当前 fiber 中
>
>更新时重点操作见下：
>1. 更新时会调用 updateHostComponent 函数，该函数内部首先会比较 props 是否发生了改变；没改变的话直接返回；
>2. props 发生了改变，把改变的属性拿出来，放到 wip.updateQueue 中，比如 `oldProps = { children: 0, style: {color: 'red'} }; newProps = {children: 2, style: {color: 'red'}}` 那么 `wip.updateQueue = {children: 2}`
>3. 把 children 的 lane 和 flag 放到当前 fiber 中

> [!tip]- completeWork 如何处理 HostText
> HostText 是 textNode；HostText 的 props 就是文本信息；比如 "static" 对应的 fiber 的 props 就是 "static"
> 
> 挂载时
> 1. 使用 createTextNode 创建 textNode
> 2. 将 fiber 信息放到 textNode 中
> 3. 把 children 的 lane 和 flag 放到当前 fiber 中
> 
> 更新时：
> 1. 如果前后 props 不一样，直接标记 update
> 2. 把 children 的 lane 和 flag 放到当前 fiber 中

completeWork 处理 Count 然后发现 sibling 不为 null 而是 Static Fiber，于是将 wip 指向 Static Fiber 并结束本次 completeUnitWork 开始 beginWork 处理 Static Fiber；

![[completeWork-Count-beginWork-Static.png]]

beginWork 处理文本 Fiber ，然后 beginWork 全部完成，再次进入 completeWork；

![[beginwork-text-fiber.png]]

completeWork 继续向上遍历，Static 与 App 都是函数组件，最终指向 HostRoot 在 completeWork 中也对 HostRoot 进行了处理；

然后因为 HostRoot 的 return 是为 null ，所以跳出 completeWork，又因为 HostRoot 也没有 sibling 所以也不会进入 beginWork ；

> [!important]- 注意
> HostRoot 的 return 指向 null 在[[#^fc88ed|第一张图]]中可以看到，HostRoot.stateNode 属性指向 FiberRootNode

此时 fiber 树已经构建完成，Render 阶段也差不多完成了。

![[render-complete.png]]