---
title: commit 阶段
description:
tags:
- react
- 源码
create_date: 2025-03-06 17:58
slug: react-commit
---

commit 阶段主要代码在 `react-reconciler/src/ReactFiberWorkLoop.js/function commitRootImpl` 中。

commit 阶段内部又分为三个小阶段：

- commitBeforeMutationEffects
- commitMutationEffects
- commitLayoutEffects

## beforeMutation 之前

在 beforeMutation 之前会去检查是否有 effect（只检查 useEffect 不会检查 useLayoutEffect，其实还有一个 ChildDeletion 先忽略），有 effect 的话就会使用 scheduler 注册一个任务也就是 flushPassiveEffects ，所以 useEffect 将是异步的。

> [[Scheduler 原理]]

在这个任务中，通过 commitPassiveUnmountEffects 和 commitPassiveMountEffects 处理副作用，先执行 commitPassiveUnmountEffects 再执行 commitPassiveMountEffects

### commitPassiveUnmountEffects

依然分为两个函数进行递归

1. commitPassiveUnmountEffects_begin
2. commitPassiveUnmountEffects_complete

> 具体的遍历过程看下面的 [[#commitBeforeMutationEffects]]

这个函数是处理 useEffect 的，但是分为了两种情况：

1. ChildDeletion 也就是卸载的组件
	1. 执行 useEffect 的 destroy
	2. 销毁 fiber 将 fiber 中置为 null
2. 需要更新的 useEffect
	1. 执行其 destroy

### commitPassiveMountEffects

依然分为两个函数

1. commitPassiveMountEffects_begin
2. commitPassiveMountEffects_complete

> 具体的遍历过程看下面的 [[#commitBeforeMutationEffects]]

所做的操作概括一下就是执行了所有 useEffect (第一次挂载或 deps 有更新的) 的 create

## commitBeforeMutationEffects

> ![tip] beforeMutation 阶段主要内容：
> 为 ClassComponent 处理 Snapshot 副作用（执行 getSnapshotBeforeUpdate）

commitBeforeMutationEffects 又分为了

1. commitBeforeMutationEffects_begin
2. commitBeforeMutationEffects_complete

```js
function commitBeforeMutationEffects_begin() {
  // 这里的 nextEffect 是 fiber 不是 effect
  while (nextEffect !== null) {
    const fiber = nextEffect;
    // ...
    const child = fiber.child;
    // *注意这里是 subtreeFlags 不是 flags，也就是找子节点，找具有 BeforeMutationMask 副作用的节点
    if (
      (fiber.subtreeFlags & BeforeMutationMask) !== NoFlags &&
      child !== null
    ) {
      child.return = fiber;
      // 向下遍历
      nextEffect = child;
    } else {
	  // *注意 这里并不是一定处理有 BeforeMutationMask 节点，假设根节点没有那些副作用，那么依然会进入 complete 处理；假设一个边缘节点没有 child 也会被处理；所以这里的遍历顺序不必较真，了解即可
      commitBeforeMutationEffects_complete();
    }
  }
}
```

> [!tip]- BeforeMutationMask
> BeforeMutationMask = Update | Snapshot

commitBeforeMutationEffects_complete 函数内部几乎只处理 Snapshot 的副作用，对应的就是 ClassComponent 的 getSnapshotBeforeUpdate 函数，执行这个函数。对于其他的组件几乎没有什么操作，直接略过。

处理完成后，就跟 completeWork 有点类似，如果有 sibling 兄弟节点，那么下一次 commitBeforeMutationEffects_begin 就从兄弟节点开始，不然就向上找，也就是 return。

```js
function commitBeforeMutationEffects_complete() {
  while (nextEffect !== null) {
    const fiber = nextEffect;
    try {
      // 在这里进行处理
      commitBeforeMutationEffectsOnFiber(fiber);
    } catch (error) {
      captureCommitPhaseError(fiber, fiber.return, error);
    }
    const sibling = fiber.sibling;
    // 找 sibling
    if (sibling !== null) {
      sibling.return = fiber.return;
      nextEffect = sibling;
      return;
    }
    // 没有 sibling 找 return
    nextEffect = fiber.return;
  }
}
```

## commitMutationEffects

> [!tip] Mutation 阶段主要内容：
> 1. 处理所有的 deletions, 对应删除 DOM 的操作
> 2. 处理各个组件的 Placement, 对应添加 DOM 的操作
> 3. 有 Ref 的先解绑 Ref
> 4. 处理 Update, 对应修改 DOM 的操作

执行的顺序依然与 beginWork 和 completeWork 类似，依然是先深度遍历，然后到 sibling 然后向上找 return

首先会通过函数递归的形式（不是循环）找到最深处的 subtreeFlags 包含 MutationMask 副作用的节点；

> [!tip]- MutationMask
> MutationMask =  Placement |  Update |  ChildDeletion |  ContentReset |  Ref |  Hydrating |  Visibility;

```js
// *代码实例，并不是真实代码
function recursivelyTraverseMutationEffects(  
  root: FiberRoot,  
  parentFiber: Fiber,  
  lanes: Lanes,  
) {  
  // ... 省略了 deletions 的代码
  if (parentFiber.subtreeFlags & MutationMask) {  
    let child = parentFiber.child;  
    while (child !== null) {   
      commitMutationEffectsOnFiber(child, root, lanes);  
      child = child.sibling;  
    }  
  }   
}

function commitMutationEffectsOnFiber(finishedWork, root, lanes) {
	switch(finishedWork.tag) {
		case ...:
			recursivelyTraverseMutationEffects(...)
			// ... 下面是剩余的，真正的处理
	}
}
```

通过上面两个函数交替执行，找到最底层的节点；

---

### Mutation 进行的副作用：

#### Deletion

首先是 deletion ，这个副作用比较特殊，不在 commitMutationEffectsOnFiber 中进行处理，而是在向深处递归的过程中，在 recursivelyTraverseMutationEffects 函数中，如果检查发现有 fiber.deletions 有值则进行处理。

> [!tip]- Deletion 补充
> Deletion 副作用的判断不是通过 flag 判断的，而是通过 fiber.deletions 这个属性进行判断，类型： `fiber.deletions: fiber[] | null`；构建 fiber 树时进行了填充 fiber.deletions 这个操作。
> 
> Deletion 在每次执行 recursivelyTraverseMutationEffects 时进行判断，也就是在递归中的「递」阶段判断。
> 
> 因为每次 fiber 树都是重新构建的，被删除的 fiber 根本不在此时的 wip fiber 树中，所以不用考虑将 deletedFiber 从 fiber 树中删除；但是 deletedFiber.return 依然有值，仅处理 deletedFiber.return 即可；也正是因为如此，后面的处理过程根本不会遍历到 deletions 的节点。

> react 用到了[标签语法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/label#%E6%B5%8F%E8%A7%88%E5%99%A8%E5%85%BC%E5%AE%B9%E6%80%A7)，感觉之前都没见过这个语法；

对于 HostComponent 和 HostText 也就是 DOM 节点

1. HostComponent 类型会先解绑 ref 也就是将 ref 置为 null
2. 递归遍历所有的后代节点，执行 deletion 操作
3. 使用 parent.removeChild 卸载 dom

> [!tip]- 为什么要递归遍历所有的后代节点？
> 注意：递归遍历所有的后代节点是因为不同类型的节点会进行不同的操作，保证每个后代节点都是 unmount 后再 removeChild 进行删除。

对于 FunctionComponent, ForwardRef, MemoComponent, SimpleMemoComponent 这些函数组件或函数组件的变体，

1. 首先遍历 updateQueue 找出所有的 useInsertionEffect 和 useLayoutEffect 并执行他们的 destroy

> [!tip]- 注意
>  没有去执行 useEffect 的 destroy, 具体为什么请看 [[#Layout 之后]]

2. 递归后代节点，执行 deletion 操作

对于 ClassComponent 

1. 解绑 ref
2. 执行 componentWillUnmount
3. 递归后代节点，执行 deletion 操作

其他类型的组件暂时忽略，但是都会有 「递归后代节点，执行 deletion 操作」这一步。

最后一步，就是处理 deletedFiber.return ，将 return 置为 null 即可。

---

#### Placement

1. 找到最近的  `HostComponent | HostRoot | HostPortal` 作为 parent
2. 如果 parent.flags 中含有 HostComponent 那么还会处理 ContentReset 副作用
3. 使用 appendChild 或 insertBefore 插入

Placement 副作用处理完成后使用 flags &= ~Placement 删除 Placement 这个副作用

#### Ref

1. 解绑 ref

#### ContentReset

1. 将文本节点的值设置为空字符串，大致为： `node.textContent = ''`
2. `flags &= ~ContentReset`

#### Updata

这个副作用需要分不同类型的进行处理

- HostComponent：

1. 找出需要更新的内容（“找出”这个操作是在之前做的，然后传递过来了， HostComponent.updateQueue 中存放的就是需要更新的内容），全部更新到 DOM 中去

- ClassComponent：

没有针对 Update 的操作

- FunctionComponent, ForwardRef, MemoComponent, SimpleMemoComponent：

首先说明一下，Update 这个副作用，不是那么容易触发的，需要函数组件中将会去执行 `useInsertionEffect`, `useLayoutEffect`, `useImperativeHandle` 中的函数时才会标记为 Update（暂时还不清楚是否有其他的方式，主要是这三个）

1. 执行所有 useInsertionEffect 的 destroy
2. 执行所有的 useInsertionEffect 的 create
3. 执行所有 useLayoutEffect 的 destroy

- HostText:

重新设置新的 text 即可： `node.nodeValue = newText`

---

### 不同类型的组件执行的操作：

#### 函数及其变体组件

1. 处理 Placement
2. 处理 Update

#### ClassComponent

1. 处理 Placement
2. 处理 Ref

#### HostComponent

1. 处理 Placement
2. 处理 Ref
3. 处理 ContentReset
4. 处理 Update

#### HostText

1. 处理 Placement
2. 处理 Update

#### HostRoot

1. 处理 Placement
2. 处理 Update

## commitLayoutEffects

> [!tip]- 总结 Layout 所做的内容
> 1. 函数组件的 useLayoutEffect
> 2. ClassComponent 的 componentDidMount | componentDidUpdate, 还有 callback
> 3. 某些原生 DOM 的挂载操作
> 4. 更新 ref

首先与 beforeMutation 类似，有两个函数，具体的遍历看 beforeMutation：

1. commitLayoutMountEffects_begin 找 `LayoutMask` 副作用
2. commitLayoutMountEffects_complete

> [!tip]- LayoutMask
>  Update | Callback | Ref | Visibility

### Layout 所做的内容

在下面对应的操作完成后，所有组件如果有 Ref 副作用，会进行处理

1. 如果 ref 属性是函数，执行函数
2. 执行 `ref.current = instance`

#### HostComponent

1. 如果是初次渲染，那么可能会针对某些元素做一些挂载的操作，比如 focus
2. 没有其他的了，attribute 已经在 mutation 阶段完成了

#### FunctionComponent | ForwardRef | SimpleMemoComponent

1. 执行 useLayoutEffect 的 create 函数（需要执行时才更新，比如第一次挂载或 deps 改变了）

#### ClassComponent

1. 如果是挂载，那么执行 componentDidMount 否则执行 componentDidUpdate
2. 执行 ClassComponent 中的 updateQueue (TODO 还不清楚 ClassComponentFiber.updateQueue 是什么)

#### HostText

不需要做任何事

## Layout 之后

Layout 之后还可能会执行 flushPassiveEffects 具体的看 [[#beforeMutation 之前]] **也就是说 useEffect 不一定都是异步，如果是通过交互引起的 useEffect 那么将会是同步，放在屏幕绘制完成之后**

这一点在 [react 官网](https://zh-hans.react.dev/reference/react/useEffect)中也有说明，在 [react 老的官网](https://legacy.reactjs.org/docs/hooks-reference.html#useeffect)上也说明了这一点是在 react 18后的特性。

这解释了为什么在 deletions 中，没有去执行 useEffect 的 destroy ，要在 commitPassiveUnmountEffects 中执行 unmount 操作，并且销毁其 fiber。