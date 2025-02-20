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