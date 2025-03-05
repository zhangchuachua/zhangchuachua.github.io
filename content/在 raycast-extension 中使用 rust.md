---
title: 在 raycast-extension 中使用 rust
description:
tags:
  - rust
  - raycast-extension
create_date: 2025-02-28 17:31
draft: true
---

## 创建一个 extension template

参考 raycast [官网文档](https://developers.raycast.com/basics/create-your-first-extension)

## 创建一个 napi-rs 项目

因为我的 rust 代码中涉及文件操作，而 wasm 在沙盒中运行，无法直接访问宿主环境，即使是 nodejs 也不行，所以我放弃了使用 wasm 的想法。

在「[[如何将 Rust 编译为 wasm？]]」中有如何在 raycast-extension 中使用 wasm 的方法。

---

## napi 与 wasm 的区别 - deepseek

`napi-rs` 的核心原理是 **通过 Node-API（原 N-API）实现 Rust 与 Node.js 的交互**。它允许用 Rust 编写高性能的 Node.js 本地插件（Native Addons），而不是 Rust 直接调用 Node.js 的底层。以下是详细解释：

---

### 1. **Node-API 的作用**
Node-API 是 Node.js 官方提供的 **稳定 ABI（应用二进制接口）层**，用于编写跨版本兼容的本地插件。它的核心目标是：
- **抽象 V8 引擎细节**：避免直接依赖 V8 的 API（不同 Node.js 版本的 V8 差异较大）。
- **跨版本兼容**：本地插件无需针对每个 Node.js 版本重新编译。
- **多语言支持**：通过 C/C++ API 暴露接口，其他语言（如 Rust）可通过 FFI（外部函数接口）绑定。

---

### 2. **napi-rs 的定位**
`napi-rs` 是 Rust 对 Node-API 的 **安全、高性能绑定**。它提供了一套 Rust 友好的工具链和宏，使得开发者可以用 Rust 编写 Node.js 本地插件，而无需手动处理 C/C++ 的底层细节。其核心功能包括：
- **类型安全**：将 JavaScript 类型（如 `JsObject`、`JsNumber`）转换为 Rust 类型（如 `String`、`i32`）。
- **异步支持**：通过 Rust 的 `async/await` 实现非阻塞操作。
- **自动生成绑定代码**：通过 `#[napi]` 宏自动生成 Node-API 的 C 接口。

---

### 3. **工作原理**
#### 步骤 1：Rust 导出函数给 Node.js
通过 `napi-rs` 提供的宏（如 `#[napi]`），将 Rust 函数标记为 Node.js 可调用的接口：
```rust
use napi_derive::napi;

#[napi]
pub fn sum(a: i32, b: i32) -> i32 {
    a + b
}
```

#### 步骤 2：编译为 Node.js 本地插件
`napi-rs` 的构建工具会将 Rust 代码编译为动态链接库（如 `.node` 文件），符合 Node-API 的二进制接口规范：
```bash
# 编译生成 .node 文件
napi build --platform
```

#### 步骤 3：Node.js 调用 Rust 函数
在 Node.js 中直接 `require` 生成的 `.node` 文件，像普通模块一样使用：
```javascript
const { sum } = require('./index.node');
console.log(sum(1, 2)); // 输出 3
```

---

### 4. **核心交互机制**
#### (1) **类型转换**
- **JavaScript → Rust**：`napi-rs` 自动将 JavaScript 类型（如 `number`、`string`）转换为 Rust 类型（如 `i32`、`String`）。
- **Rust → JavaScript**：通过 `napi-rs` 的 `JsObject` 等类型，将 Rust 数据安全地返回给 JavaScript。

#### (2) **异步操作**
利用 Rust 的异步运行时（如 `tokio`），`napi-rs` 可以将 Rust 的 `Future` 转换为 Node.js 的 Promise：
```rust
#[napi]
async fn read_file(path: String) -> Result<String, Error> {
    tokio::fs::read_to_string(path).await
}
```
在 JavaScript 中调用：
```javascript
readFile('test.txt').then(console.log);
```

#### (3) **内存安全**
- `napi-rs` 通过 Rust 的所有权机制和 Node-API 的引用计数，确保 JavaScript 和 Rust 之间的内存安全。
- 自动处理 JavaScript 对象的生命周期，避免内存泄漏。

---

### 5. **为什么不是 Rust 调用 Node.js？**
`napi-rs` 的主要方向是 **让 Node.js 调用 Rust**，而非 Rust 直接调用 Node.js 的底层。如果需要在 Rust 中调用 Node.js 的 API，通常需要：
- **反向设计**：在 JavaScript 中调用 Rust 函数时，通过参数传递 JavaScript 函数（回调模式）。
- **使用 `neon`**：另一个库 `neon` 允许更直接的 JavaScript 引擎控制（如直接操作 V8 对象），但牺牲了跨版本兼容性。

---

### 6. **与其他方案的对比**
| 方案              | 原理                     | 优点                          | 缺点                      |
|-------------------|--------------------------|-------------------------------|---------------------------|
| **napi-rs**       | 基于 Node-API            | 跨版本兼容、内存安全          | 需要编译本地插件          |
| **WASM**          | WebAssembly 沙箱        | 跨平台、无需编译              | 无法直接访问系统 API      |
| **neon**          | 直接绑定 V8              | 更灵活                        | 依赖 V8 版本，兼容性差    |
| **FFI (C/C++)**   | 手动编写 C/C++ 插件      | 极致性能                      | 开发复杂，安全性低        |

---

### 7. **典型场景**
- **性能敏感操作**：图像处理、加密解密、大数据计算。
- **系统级访问**：文件系统、网络、硬件交互（需结合 `libc` 或系统调用）。
- **复用 Rust 生态**：将现有的 Rust 库（如 `serde`、`tokio`）暴露给 Node.js。

---

### 总结
`napi-rs` 的原理是 **通过 Node-API 将 Rust 函数封装为 Node.js 本地插件**，核心是让 Node.js 调用 Rust，而非反向操作。它解决了跨版本兼容性和内存安全问题，是 Rust 与 Node.js 高性能集成的首选方案。

## napi 与直接使用 node 的区别 - deepseek

在开发中结合使用 Rust 和 Node.js，而不是完全依赖 Node.js，主要源于以下几个核心需求和优势。以下是详细的解释：

---

### 1. **性能优化：处理 CPU 密集型任务**
**为什么需要？**  
Node.js 基于单线程事件循环模型，擅长处理 **I/O 密集型任务**（如网络请求、文件读写），但在 **CPU 密集型任务**（如复杂计算、图像处理、加密解密）中性能不足。Rust 作为系统级语言，能直接操作内存、避免垃圾回收开销，显著提升性能。

**示例场景**：  
- 视频转码：用 Rust 处理视频流，比纯 Node.js 快 10 倍以上。  
- 加密算法：Rust 的 SIMD 指令优化可加速 AES 加密。  

**实现方式**：  
- **WASM**：将 Rust 代码编译为 WebAssembly，供 Node.js 调用。  
- **napi-rs**：直接编写高性能本地插件，绕过 JavaScript 的性能瓶颈。

---

### 2. **系统级操作：访问底层资源**
**为什么需要？**  
Node.js 对某些 **系统级操作**（如直接内存管理、硬件交互）支持有限，而 Rust 可以无缝调用系统 API（如 `libc`），实现更底层的控制。

**示例场景**：  
- 高性能数据库驱动：直接操作文件系统或内存映射。  
- 硬件交互：通过 Rust 调用 Linux 的 `ioctl` 接口控制设备。  

**实现方式**：  
- **napi-rs**：通过 Rust 编写本地插件，直接调用系统 API。  
- **WASI**：若使用 WASM，需通过 WASI 接口授予文件系统等权限。

---

### 3. **代码复用：整合现有 Rust 生态**
**为什么需要？**  
Rust 生态中有大量高质量的库（如解析器 `nom`、序列化 `serde`），直接复用这些库可以避免用 JavaScript 重写，节省开发时间。

**示例场景**：  
- 使用 `rustls`（Rust 的 TLS 库）替代 Node.js 的 OpenSSL 实现。  
- 复用 Rust 的机器学习库（如 `tch-rs`，PyTorch 绑定）。  

**实现方式**：  
- **WASM**：将 Rust 库编译为 WASM，供 Node.js 调用。  
- **napi-rs**：将 Rust 函数封装为 Node.js 模块。

---

### 4. **内存安全与并发优势**
**为什么需要？**  
Rust 的 **所有权模型** 和 **零成本抽象** 能避免内存泄漏、数据竞争等问题，适合开发高可靠性的核心模块。

**示例场景**：  
- 多线程数据处理：Rust 的 `Rayon` 库可轻松实现并行计算，而 Node.js 的 `worker_threads` 使用复杂且易出错。  
- 避免内存错误：Rust 编译器静态检查内存安全问题，减少线上崩溃风险。  

**实现方式**：  
- **napi-rs**：在本地插件中实现线程池，将结果返回给 Node.js。  
- **WASM**：利用 Rust 的内存安全特性，在沙箱中运行关键代码。

---

### 5. **跨平台与部署便捷性**
**为什么需要？**  
- **WASM** 的跨平台特性允许同一份代码在浏览器和 Node.js 中运行，无需针对不同环境编译。  
- **napi-rs** 生成的 `.node` 文件只需一次编译，即可跨 Node.js 版本运行。

**示例场景**：  
- 浏览器中的图像处理：用 Rust 编写核心算法，通过 WASM 在浏览器和 Node.js 服务端复用。  
- 本地插件兼容性：一次编译，支持 Node.js v14 到 v20。

---

### 为什么不直接使用 Node.js 开发？
Node.js 在以下场景中存在明显局限性，需结合 Rust 弥补：  
1. **计算性能瓶颈**：  
   - Node.js 的单线程模型在处理复杂计算时会阻塞事件循环，导致响应延迟。  
   - 例如，一个 1 秒的 CPU 任务会阻塞所有后续请求。  

2. **内存管理不足**：  
   - JavaScript 的垃圾回收机制无法精细控制内存，可能导致内存泄漏或碎片化。  
   - Rust 的静态内存管理适合高频内存操作（如实时数据处理）。  

3. **系统级功能缺失**：  
   - Node.js 无法直接调用某些系统调用（如 `epoll`、`kqueue`），而 Rust 可以。  

4. **生态库限制**：  
   - 某些领域（如密码学、高性能网络）的 Rust 库质量远超 JavaScript 实现。

---

### 如何选择 Rust + Node.js 的方案？
| **场景**               | **推荐方案**         | **工具链**              | **优势**                              |
|------------------------|----------------------|-------------------------|---------------------------------------|
| 高性能计算、复用 Rust 库 | WASM                 | `wasm32-wasi` + `wasm-pack` | 跨平台、安全沙箱、无编译依赖          |
| 系统级操作、极致性能     | napi-rs              | `napi-rs` + `tokio`     | 直接调用系统 API、线程支持、内存安全  |
| 快速原型开发            | 纯 Node.js           | -                       | 开发速度快、生态丰富                  |

---

### 总结
**需要结合 Rust 的场景**：  
- 需要极致性能（CPU/内存密集型任务）。  
- 需直接操作系统底层功能。  
- 复用现有 Rust 生态库。  
- 要求高可靠性和内存安全。  

**直接使用 Node.js 的场景**：  
- I/O 密集型服务（REST API、实时消息）。  
- 快速迭代的业务逻辑。  
- 无需底层操作或高性能计算。  

通过合理选择 Rust 和 Node.js 的集成方式（如 WASM 或 `napi-rs`），可以在保持开发效率的同时，突破 Node.js 的性能和功能限制。