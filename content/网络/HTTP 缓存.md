参考：

1. [https://juejin.cn/post/7127194919235485733](https://juejin.cn/post/7127194919235485733)

![[HTTP-cache.png]]

## HTTP/1.0

### 强缓存

Expires「是一个绝对时间, 表示资源过期时间」, 例如 `expires: Thu, 01 Dec 1994 16:00:00 GMT`

浏览器在发送请求前检查是否过期，如果未过期就直接使用缓存，如果过期则向服务器请求新的资源；

判断是否过期的逻辑是：获取本地时间戳进行比较；如果修改了本地时间，或本地时间不准，那么 Expires 就不再可靠；

### 协商缓存

Last-Modify(响应头) + If-Modified-Since(请求头) :

**Last-Modify 是文件的修改时间，请求资源时响应头如果携带了 Last-Modify 那么下一次请求就会携带 If-Modified-Since**

后端可以拿到这个时间与文件的修改时间比较；如果没有修改就返回 304；

这种方式的弊端：如果文件没有修改只是重新保存了，那么修改时间依然会改变，协商缓存会失效；

![[image 1.png]]

## HTTP/1.1
    
### 强缓存

Cache-Control 是 HTTP/1.1 的产物，具体的值见[https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control)； 

- cache-control: public, max-age=60 这个响应可以被任何对象缓存，并且在 60 秒内可以直接使用缓存；
- cache-control: no-cache 与 cache-control: max-age=0, must-revalidate 等价，表示可以进行缓存，但是每次使用缓存之前都必须去服务器验证有效性
- cache-control: no-store 不允许使用缓存，每次都必须重新请求

### 协商缓存

Etag(响应头) + If-None-Match(请求头)：

Etag 就是文件的标识符（Etag 可以有多种计算方式, 通常是 hash 值），请求资源时响应头如果携带了 Etag，那么下一次请求头就会携带 If-None-Match，值为上次响应时的 Etag 的值；

后端就可以进行比较，如果文件没有修改则返回 304；

![[image.png]]

---

还有一个请求头： `If-None-Macth` 这个请求头不用于缓存控制，但是与 `Etag` 相关，需要注意与 `If-None-Match` 的区别。

主要作用是：保证防止并发修改冲突，例如有多个用户同时修改资源，确保不会覆盖彼此的修改。

使用场景：

1. 客户端获取资源，响应头携带 `Etag`
2. 客户端发送请求，修改资源或删除资源，请求头携带 `If-Match` 值为上次响应时的 `Etag` 值
3. 服务器端收到资源，检查 `If-Match` 值是否与上次响应时的 `Etag` 值相同，如果相同则进行对应的操作；如果不相同则返回 `412 Precondition Failed` 表示条件不满足，没有执行操作；

