## 样式文件

### webpack

webpack 对于样式文件(css, sass, less...) 需要专门下载 loader 并进行配置

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        // sass-loader 将 sass 转换成 css，注意还需要下载 sass
        // css-loader 解析 css，将其转换为 js 模块，可以解析 css 中的 import 和 url 语句，还可以通过配置开启 modules 支持
        // 将解析后的 css-loader 注入到 dom 中，通常是通过创建 style 的方式
        use: ['style-loader', 'css-loader', 'sass-loader'],// loader 的执行顺序是自右向左
      },
    ],
  },
};
```

> style-loader 一般用于开发阶段，因为将 css 注入到 head 中可以快速查看样式。而在正式环境中，通常使用 `[mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin)` 把 css 提取成单独的文件，并且使用 link 进行加载；

### vite

vite 内置了 css 支持，内置预处理器支持，内置 module-css 支持，所以如果需要引入 'xx.module.scss' 时，只需要下载一个 `sass` 无需其他的配置

## ts 文件

### webpack

需要通过 `ts-loader` 或 `babel-loader`(配合 `@babel/preset-typescript` )处理 ts；

- ts-loader 默认会进行类型检查，当设置 `transpileOnly: true` 时不进行类型检查，可以加快构建速度；可以配合 [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin) 进行更快的类型检查。这个插件将会在新的线程上进行类型检查。 ts-loader 使用 tsconfig.json 作为 ts 的配置
- babel-loader 使用 [babel](https://babeljs.io/docs/babel-preset-typescript) 转换编译 ts；不会进行类型检查；使用 babel-loader 编译 ts 文件并不会使用 tsconfig.json 下的配置，而是使用 babel 自己的配置。

```js
module: {
	rules: [
		{
			test: /\.tsx?$/,
			exclude: /node_modules/,
			use: 'ts-loader',// 'ts-loader' 将 ts, tsx 变异成 js, tsx
			use: {
				loader: 'babel-loader',
				options: {
					presets: ['@babel/preset-typescript']
				}
			}
		}
	]
}
```


### vite

不需要单独进行配置，可以直接引入 ts 文件，使用 esbuild 编译 ts，速度比 tsc 更快。不会进行类型检查，可以使用 `tsc --noEmit` 进行检查。
