---
title: commit 阶段
description:
tags:
- react
- 源码
create_date: 2025-03-06 17:58
slug: react-commit
draft: true
---

commit 阶段主要代码在 `react-reconciler/src/ReactFiberWorkLoop.js/function commitRootImpl` 中。

commit 阶段内部又分为三个小阶段：

- commitBeforeMutationEffects
- commitMutationEffects
- commitLayoutEffects

## commitBeforeMutationEffects

commitBeforeMutationEffects 又分为了 commitBeforeMutationEffects_begin 和 commitBeforeMutationEffects_complete 两个函数；这两个函数的执行顺序与 beginWork 和 completeWork 有点类似，
首先是 commitBeforeMutationEffects_begin 深度优先遍历，只不过判断的条件有所改变， `child !== null && (fiber.subtreeFlags & BeforeMutationMask) !== NoFlags` 

```js
function commitBeforeMutationEffects_begin() {
  while (nextEffect !== null) {
    const fiber = nextEffect;
    // ...
    const child = fiber.child;
    if (
      (fiber.subtreeFlags & BeforeMutationMask) !== NoFlags &&
      child !== null
    ) {
      child.return = fiber;
      // 向下遍历
      nextEffect = child;
    } else {
      commitBeforeMutationEffects_complete();
    }
  }
}
```

也就是说会找到到 child 为 null 或 子节点不包含 BeforeMutationMask 这些副作用为止。

> [!tip]- BeforeMutationMask
> BeforeMutationMask = Update | Snapshot

找到指定节点后，就进入 commitBeforeMutationEffects_complete 处理，但是 beforeMutation 只处理 Snapshot 的副作用，对应的就是 classComponent 的 getSnapshotBeforeUpdate 函数，执行这个函数。对于其他的组件几乎没有什么操作，直接略过。

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

## commitMutationEffects 重点

执行的顺序依然与 beginWork 和 completeWork 类似，依然是先深度遍历，然后到 sibling 然后向上找 return

首先会通过函数递归到形式（不是循环）找到最深处的 subtreeFlags 包含 MutationMask 副作用的节点；

> [!tip]- MutationMask
> MutationMask =  Placement |  Update |  ChildDeletion |  ContentReset |  Ref |  Hydrating |  Visibility;

