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