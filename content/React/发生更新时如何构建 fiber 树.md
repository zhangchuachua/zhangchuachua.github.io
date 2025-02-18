发生更新构建 fiber 树主要通过 beginWork 进行构建；beginWork 从顶部开始向下不断遍历，然后构建 wipFiber 树，在遍历过程中将会遇到下面两种节点；

1. 无需更新的节点：直接复用 current fiber 树中对应的节点的数据
2. 需要更新的节点：创建新的 fiber 节点，部分复用 current 的数据

## 无需更新的节点

主要使用 cloneChildFibers 函数;

```ts
// 代码有所精简
export function cloneChildFibers(
  current: Fiber | null,
  workInProgress: Fiber,
): void {
  if (workInProgress.child === null) {
    return;
  }

	// 注意 wip 的 child
  let currentChild = workInProgress.child;
  let newChild = createWorkInProgress(currentChild, currentChild.pendingProps);
  workInProgress.child = newChild;

  newChild.return = workInProgress;
  while (currentChild.sibling !== null) {
    currentChild = currentChild.sibling;
    newChild = newChild.sibling = createWorkInProgress(
      currentChild,
      currentChild.pendingProps,
    );
    newChild.return = workInProgress;
  }
  newChild.sibling = null;
}

// This is used to create an alternate fiber to do work on.
export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
	  // 如果 wip 为空，那么直接初始化一个 fiber
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode,
    );
    // 重用部分数据
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    // 使用 alternate 互相指向对方
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
	  // 重置部分内容
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;
  }
	// 复用部分数据
  workInProgress.flags = current.flags & StaticMask;
  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;
	// child 
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  // Clone the dependencies object. This is mutated during the render phase, so
  // it cannot be shared with the current fiber.
  const currentDependencies = current.dependencies;
  workInProgress.dependencies =
    currentDependencies === null
      ? null
      : {
          lanes: currentDependencies.lanes,
          firstContext: currentDependencies.firstContext,
        };

  // These will be overridden during the parent's reconciliation
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;

  if (enableProfilerTimer) {
    workInProgress.selfBaseDuration = current.selfBaseDuration;
    workInProgress.treeBaseDuration = current.treeBaseDuration;
  }

  return workInProgress;
}
```

> [!important]
> 
> 1. 在 createWorkInProgress 函数中，什么情况下 workInProgress 为 null?

## 需要更新的节点(函数组件为例)