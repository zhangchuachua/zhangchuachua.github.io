[[Astro 重构]]

[[next.js 14]]

## svg 或 img 不能撑开盒子的原因

其实重点就是 `max-width` 比如下面的例子：

```HTML
<style>
      @keyframes slide {
          0% {
              transform: translate3d(0, 0, 0);
          }
          100% {
              transform: translate3d(-40%, 0, 0);
          }
      }

      .logo-slider > div {
          display: inline-block;
          padding: 0 2.2em;
          vertical-align: middle;
          outline: none;
          cursor: default;
      }

      .img-wrap {
          display: inline;
					// 当没有这个属性时，svg 可以正常的撑开盒子，让 .logo-slider 大于视口的宽度
					// 添加了这个属性后，.logo-slider 就被锁定为 100%
					// max-width: 100%;
      }

      .img-wrap > circle {
          color: \#00f3cb;
      }

      .slide:nth-child(2n) .img-wrap > circle {
          color: hotpink;
      }

  </style>
<div style='display: inline-block; white-space: nowrap; overflow: hidden; animation: slide 80s infinite linear;'>
  <div class='logo-slider'>
    <div class='slide'>
      <svg width='300' height='40' class='img-wrap'>
        <circle r='40' cy='20' fill='currentColor' />
      </svg>
    </div>
    <div class='slide'>
      <svg width='300' height='40' class='img-wrap'>
        <circle r='40' cy='20' fill='currentColor' />
      </svg>
    </div>
    <div class='slide'>
      <svg width='300' height='40' class='img-wrap'>
        <circle r='40' cy='20' fill='currentColor' />
      </svg>
    </div>
    <div class='slide'>
      <svg width='300' height='40' class='img-wrap'>
        <circle r='40' cy='20' fill='currentColor' />
      </svg>
    </div>
    <div class='slide'>
      <svg width='300' height='40' class='img-wrap'>
        <circle r='40' cy='20' fill='currentColor' />
      </svg>
    </div>
    <div class='slide'>
      <svg width='300' height='40' class='img-wrap'>
        <circle r='40' cy='20' fill='currentColor' />
      </svg>
    </div>
    <div class='slide'>
      <svg width='300' height='40' class='img-wrap'>
        <circle r='40' cy='20' fill='currentColor' />
      </svg>
    </div>
    <div class='slide'>
      <svg width='300' height='40' class='img-wrap'>
        <circle r='40' cy='20' fill='currentColor' />
      </svg>
    </div>
    <div class='slide'>
      <svg width='300' height='40' class='img-wrap'>
        <circle r='40' cy='20' fill='currentColor' />
      </svg>
    </div>
    <div class='slide'>
      <svg width='300' height='40' class='img-wrap'>
        <circle r='40' cy='20' fill='currentColor' />
      </svg>
    </div>
  </div>
</div>
```

## 服务器端直接使用 setState 导致 too many re-renders 的问题

- react 版本：17.0.2
- next.js 版本：12.1.0

```js
import { useState } from 'react';

function Temp() {
  const [value, setValue] = useState('world');
  // 在页面中这样调用 setValue 将会报错：too many re-renders
  setValue('world');
  return <div>hello {value}</div>;
}

export default Temp;
```

上面的问题是在服务器端发生的，主要就是因为服务器端的 useState 不同，返回的 set 函数也不同；服务器端的 set 函数不会去比较 prevState 与 nextState 也就不会当两者相同时直接返回优化性能；

所以在 set 时不会直接返回，所以导致重新渲染，然后再进入 set 再导致重新渲染，就进入死循环了；

```js
function dispatchAction(componentIdentity, queue, action) {
  if (!(numberOfReRenders < RE_RENDER_LIMIT)) {
    {
      throw Error( "Too many re-renders. React limits the number of renders to prevent an infinite loop." );
    }
  }

  if (componentIdentity === currentlyRenderingComponent) {
    // This is a render phase update. Stash it in a lazily-created map of
    // queue -> linked list of updates. After this render pass, we'll restart
    // and apply the stashed updates on top of the work-in-progress hook.
    didScheduleRenderPhaseUpdate = true;
    var update = {
      action: action,
      next: null
    };

    if (renderPhaseUpdates === null) {
      renderPhaseUpdates = new Map();
    }

    var firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);

    if (firstRenderPhaseUpdate === undefined) {
      renderPhaseUpdates.set(queue, update);
    } else {
      // Append the update to the end of the list.
      var lastRenderPhaseUpdate = firstRenderPhaseUpdate;

      while (lastRenderPhaseUpdate.next !== null) {
        lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
      }

      lastRenderPhaseUpdate.next = update;
    }
  }
}
```

### 不能在 then 里面直接 throw 一个 Promise

```js
new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('res')
  }, 500)
}).then(() => {
	// 这里抛出了一个 Promise 此时 Promise 依然是 pending
  throw new Promise((res, rej) => {
    setTimeout(() => {
      rej(new Error('error'))
    }, 1);
  })
}).then((response) => {
  console.log('then', response);
}).catch((reason) => {
	// 这里可以 catch 到，因为上面直接 throw 了；但是这里拿到的 reason 依然是 pending 的
	// 所以拿不到真实的错误信息；需要注意；
	// 这里会出现这个情况其实与 Promise 的源码有关，因为我们上面是直接 throw 的，直接被 try-catch 捕获了，不会进入微队列，也就不会等待 pending -> rejected
	// 解决的办法就是使用 Promise.reject 代替 throw
  console.log('catch', reason)
})
```

还有一个注意的点：`Promise.race` 中直接传入 `undefined, null` 是不可取的，将会直接返回 undefined 或 nul

```js
Promise.race([
	fetch(),
	// 当不存在 timeout 时直接返回 undefined，Promise.race 将会认为已 Fullfilled 所以直接返回 undefined 其他所有值都是这样，要注意；
	timeout ? new Promise((_, reject) => {
		setTimeout(() => {
			reject(new Error("timeout"));
		}, timeout);
	} : undefined
])
```

### img 与 svg 的额外高度问题

img 的额外高度是很好解决的，使用 `display: block` 或者 `display: inline-block; vertical-align: middle` 都可以解决，但是 svg 是不行的；

说明 svg 在作为 `inline-block` 渲染时的机制与 img 是不一样的

![[Untitled 2.png|Untitled 2.png]]

上图中，即使 svg 添加了 `inline-block align-middle` 但是 div 的高度依然会多几像素(`font-size` 为 88px 但是高度为 96px)；

> 下面是 GPT 的回答：
> 
> - `**img**` **元素的默认处理**:
>     - `img` 元素通常是一个替换元素（replaced element），它的内容不会影响行高。它的高度和宽度完全由自身的属性（如 `height` 和 `width`）决定。
>     - 浏览器在渲染 `img` 元素时，会自动处理它的对齐方式，从而避免出现额外的空间。
> - `**svg**` **元素的默认处理**:
>     - `svg` 元素虽然可以是 `inline-block`，但它并不是一个替换元素，而是一个普通的内联容器。默认情况下，它会受到字体度量的影响，从而在行高之外留下一些额外的空间。
>     - 即使设置了 `height` 和 `width` 属性，`svg` 元素仍可能受到行内布局规则的影响，从而导致额外的空白空间。

解决方法：

1. `display: block`
2. 设置父元素的 `line-height` 小于 1
3. `vertical-align: bottom`