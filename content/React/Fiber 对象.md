---
title: Fiber 对象
description: 解释 fiber 对象中的部分属性
tags:
- 开发
- 前端
- react
- 源码
create_date: 2025-02-09 01:48
filename: whats-react-fiber.mdx
share: true
---

- tag：标识 Fiber 节点的类型；下面是一些常见的值
    - `0`: **FunctionComponent**（函数组件）
    - `1`: **ClassComponent**（类组件）
    - `3`: **HostRoot**（应用的根节点，即 `ReactDOM.createRoot` 的根）
    - `5`: **HostComponent**（普通 DOM 元素，比如 `<div>`）
    - `6`: **HostText** (文本节点)
- key: 也就是 jsx 中传入的 key
- type: 指定该节点的类型，用于区分组组件或 DOM 节点
    - 对于 React 组件，值为函数（函数组件）或构造函数（class 组件）
    - 对于 DOM 元素：值为字符串（div 或 span 等)
    - 对于文本节点： 值为 nul
- stateNode：该 Fiber 节点关联的实际对象
    - 对于类组件：是类组件的实例（this）
    - 对于普通 DOM 节点：是对应的 DOM 元素
    - 对于函数组件：值为 null
    - 其他类型节点：值可能为null
- return: 父 fiber
- child：第一个子 fiber
- sibling：下一个兄弟 fiber
- pendingProps: 传递给组件或元素的 props
- memoizedProps：上一次渲染时的 props 
- memoizedState：保存组件的状态；
    - 对于类组件：值为组件实例的 state
    - 对于函数组件：值为 Hook 链表；
        
        ```js
        function App() {
        	const [count, setCount] = useState(0);
        	const handleClick = useCallback(() => {}, []);
        	const computedValue = useMemo(() => {
        		return count * count;
        	}, [count]);
        	
        	useEffect(() => {
        		console.log(window);
        	}, []);
        	
        	return <div>{count}</div>
        }
        ```
        
        ```mermaid
        flowchart LR
        App.memoizedState
        --next--> stateHookLinkList
        --next--> callbackHookLinkList
        --next--> memoHookLinkList
        --next--> effectHookLinkList
        --next--> null
        ```
        
- updateQueue: 维护组件状态更新的核心数据结构；
    - 函数组件：updateQueue 存储的是 Effect 对象链表; 此时 updateQueue 的类型为 `{ lastEffect: ... }` 假设有 3 个 useEffect，顺序如下所示：
        
        ```mermaid
        flowchart LR
        	fiber.updateQueue.lastEffect --> effect3 --> effect2 --> effect1 --> effect3
        ```
        
    - HostComponent 也就是原生 HTML 组件：在 completeWork 中将会调用 updateHostComponent 去比较 fiber 的新旧 props 如果有改动就会返回一个改动数组，并且将其标记为需要更新；
    - ClassComponent：TODO
    - HostRoot： TODO
- alternate： 双 fiber 树，所以 alternative 指向另一个 fiber 树；
    
    > [!important] 注意：渲染在页面上的是 currentFiber，触发了更新在内存中进行操作的是 workInProgressFiber 也就是 wipFiber
    
- elementType：
- flags：副作用标签
- lanes：优先级
- mode：TODO
- firstEffect：TODO
    
    ```mermaid
    flowchart TB
    	App.firstEffect --> div\#d --nextEffect--> div\#b --nextEffect--> div\#c --nextEffect--> div\#a --nextEffect--> null
    	App.lastEffect --> div\#a
    	div\#a --firstEffect--> div\#d
    	div\#a --lastEffect--> div\#c
    ```
    
- nextEffect：TODO
- lastEffect：TODO