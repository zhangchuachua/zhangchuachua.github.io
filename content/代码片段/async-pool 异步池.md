---
title: async-pool 异步池
description:
tags:
- 代码片段
create_date: 2025-03-17 16:18
slug: async-pool
---

```js
async function asyncPool(poolLimit, array, iteratorFn) {  
  const ret = []; // 存储所有任务的 Promise  const executing = new Set(); // 跟踪正在执行的任务  
  
  for (const item of array) {  
    // 创建任务的 Promise，调用 iteratorFn 执行异步操作  
    const p = Promise.resolve().then(() => iteratorFn(item));  
    ret.push(p); // 将 Promise 存入结果数组  
    executing.add(p); // 添加到执行集合  
  
    // 任务完成后从执行集合中移除  
    const clean = () => executing.delete(p);  
    p.then(clean, clean);  
  
    // 若当前执行数达到限制，等待任意一个任务完成  
    if (executing.size >= poolLimit) {  
      await Promise.race(executing);  
    }  
  }  
  
  // 等待所有任务完成并返回结果  
  return Promise.all(ret);  
}
```