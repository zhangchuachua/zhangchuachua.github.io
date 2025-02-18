参考：

1. [https://juejin.cn/post/7127194919235485733?searchId=20241126154451F990D3C81C40C48D2C95](https://juejin.cn/post/7127194919235485733?searchId=20241126154451F990D3C81C40C48D2C95)

- 强缓存
    
    通过设置 HTTP 响应头中的 Expires 或 Cache-Control 字段来指定有效期；
    
    - Expires 是 HTTP/1 的产物，「表示资源过期时间，是一个绝对时间」；判断是否过期的逻辑是：获取本地时间戳进行比较；如果修改了本地时间，或本地时间不准，那么 Expires 就不再可靠；
    - Cache-Control 是 HTTP/1.1 的产物，具体的值见[https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control)； Cache-Control 可以设置 `max-age=<seconds>` 这是一个相对时间，在这个时间内可以直接使用缓存；
- 协商缓存
    
    - Etag(响应头) + If-None-Match(请求头)：是 HTTP/1.1 的产物，Etag 就是文件的标识符，请求资源时响应头如果携带了 Etag，那么下一次请求头就会携带 If-None-Match，值为上次响应时的 Etag 的值；后端就可以进行比较，如果文件没有修改则返回 304； Etag 可以有多种计算方式；
        
        ![[image.png]]
        
    - Last-Modify(响应头) + If-Modified-Since(请求头)：是 HTTP/1 的产物；Last-Modify 是文件的修改时间，与 Etag 类似，请求资源时响应头如果携带了 Last-Modify 那么下一次请求就会携带 If-Modified-Since，后端可以拿到这个时间与文件的修改时间比较；如果没有修改就返回 304；这种方式的弊端：如果文件没有修改只是重新保存了，那么修改时间依然会改变，协商缓存会失效；
        
        ![[image 1.png]]
    
- 离线缓存
    
    不去了解
    
- Service Worker 缓存
    
    接触较少不去了解