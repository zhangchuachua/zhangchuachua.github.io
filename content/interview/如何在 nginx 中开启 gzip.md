很简单，只需要在想要开启 gzip 的服务器中添加以下内容：

```text
gzip on; # 表示开启 gzip
gzip_vary on; # 开启时将会在响应头中添加 Vary: Accept-Encoding; 表示根据 Accept-Encoding 这个请求头决定能否使用 gzip
gzip_comp_level 6; # 压缩等级 1-9 数字越大压缩率越高，占用 CPU 越多
gzip_min_length 128;# 最小压缩长度，比如这里设置 128 那么当响应大于 128 字节时将会进行压缩
gzip_types text/plain text/css application/json application/javascript application/xml application/xml+rss text/javascript; # 将会进行压缩的类型，比如这里有 文本，css，js 等会进行压缩
```

## 补充：在 express 中开启 gzip 压缩

使用 `npm install compression` 然后使用 `app.use(compression())` 即可，可以传入配置，请见[文档](https://www.npmjs.com/package/compression/v/1.0.9)

注意：有可能响应头中的 Content-Encoding 为 `br` 这其实是 `brotli` 压缩算法，比 gzip 更先进，所以如果请求头中支持这个算法，那么 compression 将会优先使用这个算法。

## nginx 什么时候进行压缩？

nginx 无论是正向代理，反向代理还是静态文件服务，都是在把响应返回给客户端之前进行压缩的。

## nginx 会缓存压缩的结果吗？

nginx 默认不会缓存，也就是说每次请求 nginx 都会重新压缩一次。
