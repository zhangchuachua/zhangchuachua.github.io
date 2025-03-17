---
title: throttle
description:
tags:
- 代码片段
create_date: 2025-03-17 15:20
slug: throttle
---
根据 lodash 的执行表现写的，所以有两个选项（其他的选项暂时没有应用场景所以没加）

- leading: boolean 首次是否立即执行
- trailing: boolean 延迟后是否执行

```js
function throttle(fn, delay, options = {}) {  
  let timer = null;  
  let ret = undefined;  
  const { leading = true, trailing = true } = options;  
  return function (...args) {  
    if (!leading && !trailing) return;  
    if (timer !== null) return ret;  
    if (leading) {  
      ret = fn.apply(this, args);  
      timer = setTimeout(() => {  
        timer = null;  
      }, delay);  
      return ret;  
    } else {
      // 只能传入箭头函数，因为箭头函数没有 this 将会使用上层的 this
      timer = setTimeout(() => {  
        timer = null;  
        if (trailing) {  
          ret = fn.apply(this, args);  
        }  
      }, delay);  
      return ret;  
    }  
  }  
}  
  
export default throttle;
```