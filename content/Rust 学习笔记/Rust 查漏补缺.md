## 为什么特征对象总是 Box<dyn T> 而不是直接 &dyn T 呢？

> 下面是 gemini 的回答，我觉得很棒：  
>   
> 
> 在 Rust 中，使用特征对象时通常使用 `Box<dyn T>` 而不是直接使用 `dyn T` 主要有以下几个原因：
> 
> **1. 安全性:**
> 
> - `dyn T` 是一个动态类型，这意味着它的大小在编译时未知。这可能会导致一些安全问题，例如：
>     - 无法在栈上分配 `dyn T` 类型的变量，因为栈需要知道变量的大小。
>     - 无法使用一些 Rust 的安全特性，例如类型擦除和借用检查。
> - `Box<dyn T>` 是一个智能指针，它可以安全地管理 `dyn T` 类型的内存。它会在不再需要时自动释放内存，避免内存泄漏。
> 
> **2. 兼容性:**
> 
> - 并非所有支持 Rust 的平台都支持直接使用 `dyn T`。例如，WebAssembly 目前不支持直接使用 `dyn T`。
> - `Box<dyn T>` 在所有支持 Rust 的平台上都可用，因此它可以提供更好的兼容性。
> 
> **3. 性能:**
> 
> - 在某些情况下，使用 `Box<dyn T>` 可能会比直接使用 `dyn T` 带来更好的性能。这是因为 `Box<dyn T>` 可以帮助编译器进行一些优化。
> 
> **4. 语法:**
> 
> - 使用 `Box<dyn T>` 的语法更加简洁易懂，尤其是在需要将特征对象作为参数传递给函数或存储在数据结构中时。
> 
> **总结:**
> 
> - 在 Rust 中，使用 `Box<dyn T>` 是一种更安全、更兼容、更高性能且语法更简洁的方式来使用特征对象。
> 
> **以下是一些关于使用特征对象的额外信息:**
> 
> **示例:**
> 
> ```rust
> // 使用 Box<dyn T>
> 
> fn foo(x: Box<dyn MyTrait>) {
>   // ...
> }
> 
> let x: Box<dyn MyTrait> = Box::new(MyStruct::new());
> foo(x);
> 
> // 直接使用 dyn T
> 
> fn bar(x: &dyn MyTrait) {
>   // ...
> }
> 
> let x: &dyn MyTrait = &MyStruct::new();
> bar(x);
> ```
> 
>   
> 
> **注意:**
> 
> - 在某些情况下，直接使用 `dyn T` 可能是合适的。例如，如果需要在函数内部创建一个临时特征对象，则可以使用 `dyn T`。
> - 在使用 `Box<dyn T>` 时，需要确保在不再需要时释放内存。可以使用 `drop` 关键字或 `Box::into_raw` 方法来释放内存。

## HRTB 经典案例

参考：

1. [死灵书](https://nomicon.purewhite.io/hrtb.html)

```rust
/* 添加 HRTB 使下面代码正常运行！ */
// *Fn 是一个 trait 用来表示函数类型
// !为什么报错：简单点来说，就是一般在声明函数时声明的「生命周期」都 >= 函数体；所以 f 的参数要求的生命周期是 >= call_on_ref_zero 函数体的；此时给他一个 zero 自然会报错
fn call_on_ref_zero<'a, F: Fn(&'a i32)>(f: F) {
    let zero = 0;
    f(&zero); // 这里会报错，报错信息是 &zero 活得不够久
}

// *正确的声明
fn call_on_ref_zero<F>(f: F)
	where
	// *这里的意思就是，使用 for<'a> 声明了一个 'a，这个 'a 表示任意的生命周期，所以此时 F 就可以接受任意生命周期的引用
		F: for<'a> Fn(&'a i32)
{
    let zero = 0;
    f(&zero);
}

fn main() {
    fn print(param: &i32) {
        println!("{}", param);
    }
    call_on_ref_zero(print);
}
```

---

注意：这个说法目前没有找到官方文档的明确声明，询问 AI 得知，在论坛中也有类似的说法

```ts
// *补充: 其实对于 Fn 这个 trait 来说，它默认就是 HRTB 所以当我们使用下面的形式时编译同样成功
fn call_on_ref_zero<F: Fn(&i32)>(f: F)
{
    let zero = 0;
    f(&zero);
}
```

## 没有那么重要遇到再说 - early bound & late bound

1. 视频资料：[bilibili](https://www.bilibili.com/video/BV1pV4y1h7oh/?spm_id_from=333.788&vd_source=03260f3818fc9cdce24a9ce4b1b8521e)
2. 相关提案：[rust 官方 RFC](https://rust-lang.github.io/rfcs/0387-higher-ranked-trait-bounds.html)

```rust
// *这一块应该没有特别重要，遇到再说
// *这个就是一个 late bound 因为它需要 f 在执行的时候确定生命周期
fn f<'a>() {}
// *这就是一个 early bound 因为它在声明的时候就确定了 'a 的生命周期至少要 >= 'a；它在声明的时候就已经被约束了
// *还有一种在 struct 的 impl 声明生命周期出现在了 self 类型上(具体没太懂，在 rust 官方 RFC 中有说但是也没有解释)
fn g<'a: 'a>() {}

fn main() {
  let ff = f;
  let gg = g::<'static>;
}
```

## 生命周期 re-borrow

### 参考

1. 呼吁官方完善 re-borrow 文档的 [https://github.com/rust-lang/reference/issues/788](https://github.com/rust-lang/reference/issues/788)，这个 issue 里面有挺多的 re-borrow 的资料和解释
2. 再借用是在 [NLL](https://course.rs/advance/lifetime/advance.html#nll-non-lexical-lifetime) 的基础上进行的，如果忘记了请复习
3. [引用](https://course.rs/basic/ownership/borrowing.html)其实就是借用，如果忘记了请复 习

  

> [!important] &T 实现了 Copy 特征，
> 
> `&mut T` 没有实现 Copy 特征

```rs
// &T 实现了 Copy 特征，&mut T 没有实现 Copy 特征
fn main() {
    {
				// 这块代码都可以编译成功，应该可以看出 &T 实现了 Copy 特征了吧
        let v: Vec<i32> = vec![];
        let vr = &v;
				// 直接把 vr 的引用复制给了 vrr
        let vrr = vr;
				// 所以这里还可以使用 vr
        println!("{:?}", vr);
        println!("{:?}", vrr);
    }
		{
				// 因为 &mut T 没有实现 Copy 特征
				let mut v: Vec<i32> = vec![];
		    let vr = &mut v;
				// 所以这里把 vr 的所有权转移了
		    let vrr = vr;
		    println!("{:?}", vr); // 所以这里会报错
		    println!("{:?}", vrr);
		}
}
```

  

---

  

> [!important] 再借用并不是就无视「不能同时存在一个以上可变引用」的规则，再借用只是在 NLL 的基础上，方便我们开发的？

### 再借用的规则

1. 一般都是针对 `&mut`
2. 一般需要显式的类型声明
3. 等效于「解引用」+ 「引用」
4. 再借用期间，不能使用原先的引用

```rs
fn main() {
	let mut i = 42;
	let x = &mut i;
	let y: &mut i32 = x; // 这里就是再借用了, 但是注意声明 y 的类型是必需的(对应第二条)，这里不能让编译器自动推导，必须要确保 y 是 &mut T 的
	// 上面的代码等效于下面这一行：「解引用」+ 「再次引用」(对应第三条)
	// let y = &mut *x;

	// 如果去掉类型，就会报错；
	// let y = x;

	// 下面呢这一行打印会编译失败，因为 y 已经再借用了，那么在 y 最后一次使用前，不能使用 x；下面还有一行 y 的赋值和打印，所以这里会报错
	// println!("x = {}", *x);

	*y = 43;
	println!("y = {}", *y);// 打印 43

	// 上面 y 已经最后一次使用了，已经结束了，所以这里使用 x 不会报错
	*x = 44;
	println!("x = {}", *x);// 打印 44
}
```

  

---

  

```rs
// 函数中的 reborrow
fn main() {
  let mut i = 42;
  let x = &mut i;

  // *这里其实也是 reborrow 因为 &mut T 没有实现 Copy 所以根据之前的理解，这里需要把所有权转移进行；其实这里使用的就是 reborrow
  change_i(x);
  println!("x = {x}");

  *x = 44;
  println!("i = {}", x);
}

fn change_i(mut_i32: &mut i32) {
  *mut_i32 = 43;
}
```

  

  

## 闭包

  

> 闭包捕获值时，将会分配内存去存储这些值。对于某些场景来说，这种额外的内存分配会成为一种负担。与之相比，函数就不会去捕获这些值；

### 1. 闭包不能直接使用范型

```rs
fn main() {
		let x: i32 = 2;
    let sum = |y: T| format!("{} - {}", x, y); // 这里会编译出错，不能直接使用范型

    let p = sum("f");
    let pp = sum(1);
    println!("{}", p);
    println!("{}", pp);
}

// 但是可以通过函数来使用范型
fn apply<T, F: Fn(T)>(f: F, val: T) {
    f(val);
}
fn main() {
    apply(|x| println!("{}", x), 10);
    apply(|x| println!("{}", x), "Hello");
}
```

### 2. FnOnce

圣经里面是这样说的：

> `FnOnce`，该类型的闭包会拿走被捕获变量的所有权。

然后举了一个这样的例子

```rs
fn fn_once<F>(func: F)
where
    F: FnOnce(usize) -> bool,
{
    println!("{}", func(3));
    println!("{}", func(4));// 这里会报错，报错原因是：use of moved value: func
}

fn main() {
    let x = vec![1, 2, 3];
    fn_once(|z|{z == x.len()})// 因为上面那句话导致我一直以为拿走了 x 的所有权
}
```

其实报错里面说的很清楚了，是 `func` 的所有权被转移了，`FnOnce` 顾名思义就是只能执行一次的函数或闭包，在 `func` 被执行一次后 `func` 这个变量就被释放了！

下面是 `FnOnce` 这个 `trait` 的实现

```rs
pub trait FnOnce<Args> {
    /// The returned type after the call operator is used.
    #[lang = "fn_once_output"]
    #[stable(feature = "fn_once_output", since = "1.12.0")]
    type Output;

    /// Performs the call operation.
    #[unstable(feature = "fn_traits", issue = "29625")]
    extern "rust-call" fn call_once(self, args: Args) -> Self::Output; // !注意看这里，将 self 传递了进来，而不是 &self 就可以理解为直接把所有权转移到了函数里面，函数执行完成后自然就释放了
}
```

### 3. FnMut

`FnMut` 的实现如下：

```rs
pub trait FnMut<Args>: FnOnce<Args> {
    /// Performs the call operation.
    #[unstable(feature = "fn_traits", issue = "29625")]
    extern "rust-call" fn call_mut(&mut self, args: Args) -> Self::Output;// 这里接收一个 &mut self
}
```

🌰：

```rs
fn main() {
    let mut s = String::new();

    let update_string = |str| s.push_str(str);

		update_string("hello ");// 这里会报错，因为上面要求一个 &mut self 但是 update_string 并不是 mut 的；只需要给 update_string 添加一个 mut 即可


    println!("{:?}", s);
}
```

### 4. `FnOnce FnMut Fn` 三者间的关系

从上面分别的实现上来看： `fn` 是 `FnMut` 的子类型， `FnMut` 是 `FnOnce` 的子类型；

  

> 引用圣经中的内容：  
>   
> 
> - 所有的闭包都自动实现了 `FnOnce` 特征，因此任何一个闭包都至少可以被调用一次
> - 「没有移出」所捕获变量「所有权」的闭包自动实现了 `FnMut` 特征
> - 「不需要」对捕获变量进行「改变」的闭包自动实现了 `Fn` 特征
> 
>   
> 所以每个闭包都至少实现了  
> `FnOnce` 并且还可以实现其他特征

```rs
// 解释第二条规则
fn main() {
    let mut s = String::new();

		// 这里会报错，因为它不符合 FnMut 的标准，所以它相当于只实现了 FnOnce
		// 所以报错内容是 closure implements FnOnce not FnMut
    let mut update_string = |str| -> String {s.push_str(str); s };// 这里把 s 的所有权移出了

    exec(update_string);
}

fn exec<'a, F: FnMut(&'a str) -> String>(mut f: F) {
    f("hello");
}
```

### 5. 闭包是可 Copy 的

  

> 引用圣经：  
>   
> 只要闭包捕获的类型都实现了  
> `Copy`特征的话，这个闭包就会默认实现`Copy`特征。

## 数组

  

> 根据[圣经](https://course.rs/advance/into-types/converse.html#%E7%82%B9%E6%93%8D%E4%BD%9C%E7%AC%A6)  
>   
> 数据并没有实现 Index 特征，也就是说数组并不能通过  
> `array[0]` (`arrar[0]` 其实就是 `array.index(0)` 的语法糖) 获取值；但是为什么 `array[0]` 可以生效呢？是因为 rust 中的类型转换，详情请见上面的圣经参考；

  

## rust 中的自动解引用的规则

> 圣经中请参考：[https://course.rs/advance/smart-pointer/deref.html](https://course.rs/advance/smart-pointer/deref.html#deref-%E8%A7%84%E5%88%99%E6%80%BB%E7%BB%93)

### 函数中的自动解引用

1. 当参数是「不可变引用参数」时，将会自动解引用
2. 多次引用的参数也会自动解引用
    
    ```rs
    fn main() {
    	let number = 1;
    	baz(&&&&number);// 不会报错顺利执行
    }
    
    fn baz(x: &&&&i32) {
    	println!("{}", x);
    }
    ```
    
3. 「可变引用参数」，不会自动解引用，只能显式地解引用

---

### 使用引用修改值

1. 当有多层级的引用时，如果要修改值，那么需要正确的解引用层级；
    
    ```rs
    fn main() {
    	let mut number = 1;
    	let n1 = &mut number;
    	let n2 = &mut n1;
    	let n3 = &mut n2;
    	
    	// *这里将会报错；因为引用有 3 级，但是这里是二级的引用；
    	**n3 = 2;
    	
    	// *这里不会报错；正确的层级
    	***n3 = 2;
    	
    	println!("{n3}");
    }
    ```
    
2. `let mut n1 = &number` 这样的声明不是「可变应用」，必须得使用 `&mut number` 这样才是「可变引用」；

  

## 居然可以直接对范型实现 trait

```rs
trait F {}
impl<R> F for R {}
fn main() {}
```

上述代码不会报错；也不知道有什么意义；