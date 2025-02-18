当 useCallback 的 deps 为空数组时，执行函数不能获取到最新的状态；

这是因为函数组件内部就是一个闭包，而 useCallback 内部源码把 callback 保存到了外部，此刻这个 callback 只能访问它的闭包里面的内容

而函数组件更新状态重新执行时，如果 deps 为空数组，那么只会去执行老的 callback 所以就不能获取到新的状态，有点类似于：

```js
let state;
let callback;
function App() {
  const [clicked, setClicked] = ((initialState) => {
    if (!state) {
      state = [
        initialState,
        (nextState) => {
          if (typeof nextState === 'function') {
            return nextState(state[0]);
          }
          state[0] = nextState;
        },
      ];
      return state;
    }
    return state;
  })(false);

  const handleClick = ((fn, deps = null) => {
    if (!callback) {
      callback = [fn, deps];

      return fn;
    }

    if (!deps) {
      return fn;
    }

    const [prevFn, prevDeps] = callback;

    if (prevDeps.length !== deps.length || !prevDeps.every((dep, i) => dep === deps[i])) {
      return fn;
    }

    return prevFn;
  })(() => {
    console.log('clicked', clicked);
  }, []);

  console.log('app clicked', clicked);

  handleClick();
}

Dpp();// 打印 app clicked false - clicked false
state[1](true)
Dpp();// 打印 app clicked true - clicked false
```