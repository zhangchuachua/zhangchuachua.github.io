1. useState 在挂载时和更新时执行的函数是不一样的
2. 挂载时执行的是 mountState
    1. mountState 内部会首先为这个 hook 创建一个 Hook 对象，详情见： [[Hook 对象]]
    2. 然后使用 initialState 为 Hook 对象中的 memoizedState 和 baseState 赋值；
    3. 然后返回一个数组给组件即可；
3. 更新时执行的是 updateReducer (useState 就是 useReducer 的变体)
    1. 首先去获取这个 hook 对应的 Hook 对象；
    2. 然后将需要更新的内容拼接成一个循环链表；
    3. 然后遍历链表，进行更新，将更新的 state 值存储到 hook.memoizedState 上；
    4. 然后比较上一次的值，如果不一样，则需要进行更新，否则没有改动；
    5. 返回一个数组；