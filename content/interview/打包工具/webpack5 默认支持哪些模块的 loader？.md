webpack 5 默认支持

1. js 模块：esm, commonjs, amd
2. json 文件
3. asset 模块：图片、字体、视频等静态资源，替代了之前的 file-loader 和 url-loader
4. wasm 模块，可以使用 import 直接引入 wasm 模块，调用其 init 函数
5. node 模块，在配置中设置 `target: 'node'` 时，支持 fs, path 等的原生 fs 模块

上述的模块，webpack5 无需下载其他的 loder 即可默认支持。