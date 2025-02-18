---
title: Astro-remote 源码阅读
description: ""
keywords:
- astro
- astro-remote
- markdown
tags:
- 开发
- 前端
- react
- 源码
slug: how-to-render-remote-markdown-in-astro
lang: cn
author: zhangchuachua
created_at: 2025-02-07 02:08
share: false
---

项目中需要将来自于 CMS 的 markdown 渲染为 html；通过阅读 astro-remote 的源码解决以下问题：
1. astro-remote 可以接收 astro 组件也可以接收 react 组件，怎么做到的？
2. 接收 react 组件时默认是 server component 如何注册为 client component ？项目中需要用到

---

第一个问题：

astro-remote 中使用下面这个函数来处理接收到的 component 

```typescript
export function createComponentProxy(  
  result: any,  
  _components: Record<string, any> = {},  
) {
  const components: Record<string, any> = {};  
  for (const [key, value] of Object.entries(_components)) {  
    if (typeof value === "string") {  
	  // 原生元素
      components[key] = value;  
    } else {  
	  // 组件都被包装为一个 异步函数；渲染组件时就会执行这个函数
      components[key] = async (  
        props: Record<string, any>,  
        children: { value: any },  
      ) => {  
        if (key === "CodeBlock" || key === "CodeSpan") {  
          props.code = entities.decode(JSON.parse(`"${props.code}"`));  
        }  
        // h 函数是 astro/jsx-runtime 相当于使用 astro 创建一个 astro 组件；与 react 类似，这个 obj 是一个对象大致的格式为 { [Render]: 'astro:jsx', [AstroJSX]: true, type: value, props }
        const obj = h(value, { ...props, "set:html": children.value });  
        // console.log(key, obj);  

		// renderJSX 来自于 astro/runtime/server/jsx 
        const output = await renderJSX(  
          result,  
          obj,  
        );  
        return __unsafeHTML(output);  
      };  
    }  
  }  
  return components;  
}
```