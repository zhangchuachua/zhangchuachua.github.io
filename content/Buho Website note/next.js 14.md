---
title: next.js 14
description:
tags:
- 开发
- next.js
create_date: 2025-02-18 22:49
draft: true
---

# React + typescript

## 组件 props 继承 HTMLElement props

```ts
import { ComponentProps } from 'react';
interface CustomAnchor extends ComponentProps<'a'>{
	custom: string;
}
```

## 如何获取 HTMLElementAttributes

```ts
import { HTMLAttributes } from 'react';
type attr = HTMLAttributes<HTMLAnchorElement>
```