---
title: debounce
description:
tags:
- 代码片段
create_date: 2025-03-17 15:15
slug: debounce
---

根据 lodash 的执行表现写的，所以有两个选项（其他的选项暂时没有应用场景所以没加）

- leading: boolean 首次是否立即执行
- trailing: boolean 延迟后是否执行

```js
function debounce(fn, delay, options = {}) {  
  let timer = null;  
  let ret = undefined;  
  const { leading = true, trailing = true } = options;  
  return function (...args) {  
    if (!leading && !trailing) return;  
    if (timer === null) {  
      if (leading) {  
        timer = setTimeout(() => {  
          timer = null;  
        }, delay);  
        ret = fn.apply(this, args);  
        return ret;  
      }  
    }  
    clearTimeout(timer);  
    timer = setTimeout(() => {  
      timer = null;  
      if (trailing) {  
        ret = fn.apply(this, args);  
      }  
    }, delay);  
    return ret;  
  }  
}  
  
export default debounce;
```