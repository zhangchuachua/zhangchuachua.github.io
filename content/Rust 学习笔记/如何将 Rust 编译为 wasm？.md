---
title: 如何将 Rust 编译为 wasm
description: 如何将 Rust 编译为 wasm? 本文将演示使用 wasm-pack 将 rust 编译为 wasm 的全过程。
tags:
  - rust
  - wasm
create_date: 2025-02-27 13:41
slug: how-rust-comiles-to-wasm
---

## 初始化一个 Rust 项目

使用 `cargo new example --lib` 初始化一个 Rust 项目，如果还没有下载 Rust 的可以参考[官方文档](https://www.rust-lang.org/tools/install)，大概结果如下所示：

```
.
├── Cargo.toml
└── src
    └── lib.rs
```

## 安装对应的依赖

使用 `cargo install wasm-pack` 安装 `wasm-pack`，然后再使用 `cargo add wasm-bindgen` 安装 `wasm-bindgen`

> [!tip] 提示
> `cargo install` 用于安装二进制文件，类似于在计算机上安装一个软件，可以直接调用
> `cargo add` 就是在项目中安装了一个依赖

## 修改 `Cargo.toml` 文件

需要添加下面的属性在 Cargo.toml 中：

```toml
[lib]
crate-type = ["cdylib"]
```

表示 Rust 库将被编译为一个 "C-compatible dynamic library" c兼容的动态库；

## 修改 `lib.rs` 文件

修改 `lib.rs` 文件，导出示例函数，后续就可以在 js 中使用导出的函数；wasm_bindgen 的仓库地址：[https://github.com/rustwasm/wasm-bindgen](https://github.com/rustwasm/wasm-bindgen)

```rust title="src/lib.rs"
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
	a + b
}
```

## 开始 build

使用 `wasm-pack build` 即可（如果是第一次执行 `wasm-pack build` 那么将会下载一些），默认将会输出到 pkg 文件夹下，文件结构如下所示：

```
pkg
├── example.d.ts
├── example.js
├── example_bg.js
├── example_bg.wasm
├── example_bg.wasm.d.ts
└── package.json
```

wasm-pack 可以传入其他的选项，例如：
1. target 指定生成的 pkg 的格式，比如 `wasm-pack build --target web` 就可以在 index.html 中直接引入；
2. out-dir 指定输出的目录，比如 `wasm-pack build --out-dir ./out` 

具体的参数请看 [wasm-pack 文档](https://rustwasm.github.io/wasm-pack/book/)

## raycast-extension 中使用 wasm 示例

在 wasm-pack 文档中已经有很多示例了，但是开发 raycast extension 的情况有点特殊；

首先，raycast extension 的环境是 node 于是使用 `wasm-pack build --target nodejs --out-dir ../test/src/wasm` 把库打包成 nodejs 的格式，并且导出到 extension 的 wasm 目录下供使用。

但是在使用时发生报错：`Error: ENOENT: no such file or directory, open '/Users/***/.config/raycast/extensions/test/example_bg.wasm'`

打开 example.js 可以发现：

```js title="src/wasm/example.js"
const path = require('path').join(__dirname, 'helper_bg.wasm');
const bytes = require('fs').readFileSync(path);
```

使用 readFileSync 去读取文件，可是读取不到指定的文件，通过报错信息可以知道，读取的路径并不是开发时的路径，raycast 将会把 extension 放在指定的目录（系统不一样，路径可能不一样）中，就是上面那一坨；

我想的解决方法就是把 wasm 也打包进去就行了，raycast 使用 @oclif/core 进行打包，将会把所有的内容都打包到一个 js 中去；

所以如果要把 wasm 也打包进去，那肯定不能使用文件路径读取的方式；于是修改 `example.js` 到如下的形式：

```js title="src/wasm/exmaple.ts"
import * as __wasm from './helper_bg.wasm';
const bytes = __wasm.default;
```

这样就可以了， wasm 会被打包进去，然后内容都在 default 里面；再次测试，发现没有报错正常输出。

## 其他内容

wasm-pack 编译后的成果物可以发布到 npm 通过 npm 安装后可以直接使用；但是如果是上面的情况，也是不可以的；在 raycast-extension 中也有人遇到了这样的问题，这是 [issue](https://github.com/raycast/extensions/issues/15736)

wasm-pack 内部就是使用的 wasm-bindgen 去生成内容；比如使用 `wasm-pack build` 与使用 `wasm-bindgen --target bundler --out-dir ./pkg ./target/wasm32-unknown-unknown/relase/example.wasm` 获得的成果物是一样的。

所以合理推测：rust 通过 `cargo build --target wasm32-unknown-unknown` 生成“裸” wasm 然后再通过 wasm-bindgen 去添加胶水 js 。

wasm-pack 添加了一些新内容比如发布到 npm。