---
title: useCallback 是否支持异步函数
description:
tags:
- 开发
- 前端
- react
- 源码
slug: useCallback-async-callback
create_date: 2025-02-09 01:48
share: false
---

支持

```js
function App() {
	const handleClick = useCallback(async () => {
		const res = await fetch(...);
		if(res.ok) {
			const data = await res.json();
			console.log(data);
		}
		
	}, [])
	return <button onClick={handleClick}>load data</button>
}
```