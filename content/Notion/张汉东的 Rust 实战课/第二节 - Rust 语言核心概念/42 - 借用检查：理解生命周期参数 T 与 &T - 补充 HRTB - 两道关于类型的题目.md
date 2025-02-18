## HRTB

> HRTB 的 RFC: [https://www.ncameron.org/rfcs/0387](https://www.ncameron.org/rfcs/0387)

首先需要介绍 HRTB 在 [[Rust 查漏补缺]] 其实已经介绍过了，但是当时不太懂；还是使用一样的示例：

```rs
// 这个 wrap 函数是没有问题的，f 是一个回调函数， zero 的生命周期大于 f 的栈帧（也就是 f的执行的那段时间） 都很合理；但是会得到一个报错；
// 为什么会报错？简单的来说，就是 'a 也可以看作是一个参数，参数的生命周期都是大于函数执行期的（不可能在函数执行期间，参数被释放了）；所以 'a 这个生命周期天生就是大于 wrap 执行期的；
// 然后 f 需要一个 'a 生命周期的参数，而 zero 的生命周期明显小于 wrap 执行期；所以约定不成立，就会报错；
fn wrap<'a, F: Fn(&'a i32)>(f: F) {
    let zero = 0;
    f(&zero); // 这里会报错，报错信息是 &zero 活得不够久
}

// 要想修复报错，就需要使用到 HRTB 高阶 Trait 约束
// for<'a> 可以理解为："for all choices of 'a", and basically produces an infinite list of trait bounds that F must satisfy. 翻译不出来，反正就是这样定义的生命周期，包含了所有可能，F 必须满足；
fn wrap<F>(f: F)
where
    for<'a> F: Fn(&'a i32),
{
    let zero = 0;
    f(&zero);
}

// for 可以写在两个地方
fn wrap<F>(f: F)
where
    F: for<'a> Fn(&'a i32),
{
    let zero = 0;
    f(&zero); // 这里会报错，报错信息是 &zero 活得不够久
}

// 当然 HRTB 对于 FnOnce, FnMut, Fn, fn 是有语法糖的，不需要手动添加
// 编译通过；
fn wrap<F: Fn(&i32)>(f: F)
{
    let zero = 0;
    f(&zero);
}

// 编译通过
fn wrap(f: fn(&i32)) {
    let zero = 0;
    f(&zero);
}
```

> [!important] HRTB：可以简单的理解为就是语法
> 
> `for<'any>` ，这个 `'any` 可以是任何生命周期，也就是说它可以满足任何对生命周期的约定；  
>   
> 它允许你在一个函数或类型中泛化某个生命周期，使其能够适用于所有可能的生命周期。  

> [!important] 注意：
> 
>   
>   
> HRTB  
> `for <’any>` 创建了一个「==**任何生命周期 ‘any**==」;  
>   
> 使用 HRTB 时编译器期望目标接受这个==**「任何生命周期」**==详情见下面的例子

```rs
trait Look<'a> {
    fn method(&self, s: &'a str);
}
impl<'s> Look<'s> for &'s i32 {
    fn method(&self, s: &str) {
        println!("Hi there, {s}!");
    }
}

fn main() {
    // 这里将会报错；报错信息是：对于任何生命周期，Look<'0> 都应该为 &i32 实现，但是 Look<'1> 实际上是为类型 &'1 i32 适用于特定的生命周期 '1
    // *for 声明的生命周期是「任何生命周期」而上面的实现是在特定的生命周期 's 下为 &'s i32 实现了 Look<'s> ；而这里使用的是  &0 也就是 &'_ i32

    // *因为上面的实现是为 &'s i32 实现的，所以只要使用 &'_ i32 替换 &'s i32 就可以让编译通过；
    // *因为上面实现的是 Look<'s> 所以只要使用 Look<'_> 替换 Look<'s> 也可以让编译通过
    // !'s 可以是任何生命周期
    // ?为什么需要 's 需要同时在 trait 和 类型中使用才会报错呢？
    // !因为同时在这两个地方使用造成了，在特定生命周期 's 下为 &'s i32 实现了 Look<'s> ；使用 &'_ i32 时 Look<'s> 可以接受 任何生命周期; 使用 Look<'_> 时，编译器将会使用 &0 去推断 's; 's 自然是可以接受 &0 的生命周期的； 只有当 's 在两个地方使用了，才会出现 's 通过推断变成特定生命周期的情况
    let _bx: Box<dyn for<'any> Look<'any>> = Box::new(&0);
}
```

```rs
trait Look<'s> {
    fn method(&self, s: &str);
}
impl Look<'static> for &i32 {
    fn method(&self, s: &str) {
        println!("Hi there, {s}!");
    }
}

fn main() {
    // *上面为 &i32 实现 Look<'static> 这里编译依然出错，因为 'static 是一个固定的生命周期；这里要将 「任何生命周期」 分配给 'static 自然也不行，依然是那个规则：要使用 HRTB 那么就必须要接受 「任何生命周期」
    let _bx: Box<dyn for<'any> Look<'any>> = Box::new(&0);
}
```

> [!important] 总结上面的题：
> 
>   
>   
> 1. Rust 中的 trait 与 trait 实现是「==**不变**==」的，比如上面的 `impl Look<’static> for &i32` 是指为 &i32 实现了 `Look<’static>` 但是并不能代表为 &i32 实现了 `Look<’any>` 所以代码报错；

## Rust quiz #5

这是 Rust quiz 的第五题；

> Rust 社区问答：==**[Rust Quiz 5: when will higher-ranked closure type be yielded?](https://users.rust-lang.org/t/rust-quiz-5-when-will-higher-ranked-closure-type-be-yielded/68874)**==

> [!important] 注意：一个 trait 只能为一个类型实现一次，不能实现多次，实现多次时将会报错；
> 
>   
>   
> 注意：  
> `impl<T> SomeTrait for T {}` 将会为所有的类型实现 `SomeTrait` ; 范围貌似是当前模块(不确定)；

```rs
trait Trait {
    fn p(self);
}

impl<T> Trait for fn(T) {
    fn p(self) {
        println!("1");
    }
}

// *首先要确定：虽然 T 里边已经包含了 &T &mutT 但是这里的类型 fn(&T) 肯定与上面的 fn(T) 是不一样的 不然的话已经报错了；至于为什么不一样，可以进行脱糖处理；
// 1. impl <'a, T> Trait for fn(&'a T) {} late bound 的生命周期，但是使用这样的写法会报错，说明了这样的写法被包含在 T 中
// 2. impl <'a, T: 'a> Trait for fn(&'a T) {} early bound 的生命周期，但是这样的写法依然会报错，说明了这样的写法被包含在 T 中
// !3. 就是上面介绍过的 HRTB 了，上面也说到过 fn 这样的类型自动实现了 HRTB 的语法糖，所以如果使用 1 和 2 的写法，相当于是破坏了语法糖，所以会报错 impl <T> Trait for for<'a> fn(&'a T) {} 这样的方法不会报错，说明这样的写法与 T 不是一个类型的，详情见：https://github.com/rust-lang/rust/issues/56105 这样的写法目前来说是一个新的类型，但是以后可能会报错； rust-analyzer 其实也进行了警告: "trait 实现冲突" 与错误的信息一样；只不过变成了警告
impl<T> Trait for fn(&T) {
    fn p(self) {
        println!("2");
    }
}

fn f(_: u8) {}
fn g(_: &u8) {}

fn main() {
    let a: fn(_) = f;
    let b: fn(_) = g;
    // *这里的显示类型声明 「表示希望得到这个类型」 编译器就会尝试去转换为这个类型，如果去掉了 `: fn(&_)` 那么代码依然会报错，因为 g 自身也是一种类型，「函数项类型」之前讲过；
    let c: fn(&_) = g;
    // ?下面的代码是报错？还是正常运行，正常运行会输出什么？
    // 上面解释了不会报错的原因，那么接下来就是输出的顺序了；参考： https://rustwiki.org/zh-CN/reference/expressions/method-call-expr.html 方法调用表达式；
    // 方法调用时，1. 去找类型上直接实现的方法 2. 找不到就去找 T 已实现的可见的 trait 提供的方法；
    // fn 肯定不包含 p 方法，所以从 trait 去找方法；
    a.p(); // a 类型是 fn(u8) 对应 fn(T) 输出 1
    b.p(); // b 的类型是 f(u8) 对应 fn(T) 此时 g 相当于 `impl <'a, T> for fn(&'a T)函数指针` 的实现 输出 1
    c.p(); // c 的类型是 f(&u8) 对应 fn(&T) 此时 g 相当于 `impl <T> for for<'a> fn(&'a T)函数指针` 的实现 输出2
}
```

> [!important] 总结:
> 
> `impl<T> Trait for fn(T) {}` 与 `impl <T> Trait for for<'a> fn(&'a T) {}` 不是一个类型

  

## 知乎 https://zhuanlan.zhihu.com/p/194156624

报错的代码如下：

```rs
use std::{borrow::Borrow, collections::HashSet};

fn main() {
    let hello = "hello".to_owned();

    let mut global_set: HashSet<&str> = HashSet::new();
    global_set.insert(hello.as_str());

    if !global_set.is_empty() {
        let mut temp_set = HashSet::new();
        for &item in global_set.iter() {
            let copy = item.to_owned();
            let copy_str = copy.as_str();
            // 这一步使用 &copy_str 报错，如果使用 copy_str 报错解除
            // 报错信息时 copy 活得不够长；借用在 temp_set.insert(inner) 哪里使用了；
            // 但是很明显， copy 是完全可以活到 insert 哪里去的；
            let value = global_set.get(&copy_str);
            if let Some(inner) = value.cloned() {
                temp_set.insert(inner);
            };
        }
    }
}
```

---

**解析：**

> [!important] TODO 但是说实话这个解析不太懂，等以后再来探索吧；

```rs
// 创建一个类似于上面从 HashSet 中 get 值的函数；根据生命周期消除规则吧生命周期都声明出来；因为上面的报错是生命周期报错；
// 注意 "hello".to_owned().as_str() 这样获取的 &str 的生命周期并不是 &'static 准确的来说，字符串切片除了 "sdasd" 这样的字面量外，其他不是 &'static；因为 String 时存放在堆上的；而字面量是存放在静态区域的；
fn foobar<'a, 'b, 'c, 'k>(set: &'b HashSet<&'a str>, key: &'c &'k str) -> Option<&'b &'a str>
where
    'a: 'b, // 'a: 'b 很好理解，如果 &HashSet<&str> &str 都释放了，&HashSet 还没释放，那不是就悬垂引用了
    'k: 'a, // *如果注释这一句，下面的 get 就会报错，否则就编译通过；那么重点就是这个生命周期约束；
{
    // 之前说过，生命周期就是约定，如果 'k: 'a 可以让编译通过，那么说明 get 函数就期望得到这样的约束；那么就去看 HashSet::get 的源码
    // 可以看到 T: Borrow<Q>; 此时的 T 是 &'a str Q 是 &'k str 那么得到 &'a str: Borrow<&'k str> 知乎里面的解释是：这里就可以看作 import T for Borrow<T> {} 但是要想把 &'a str 与 &'k str 看作同一个类型的话，那么 'k 一定要大于等于 'a 所以这里加了一个 'k: 'a 就可以通过编译了；
    // 为什么上面直接使用 copy_str 就不会报错呢？ 可以得到 &'a str: Borrow<str> 然后 Borrow 实现了 impl<'_> Borrow<T> for &'_ T 这个生命周期是不重要的，所以可以通过编译；
    set.get(key)
}

// get 的源码
pub fn get<Q: ?Sized>(&self, value: &Q) -> Option<&T>
where
    T: Borrow<Q>,
    Q: Hash + Eq,
{
    self.base.get(value)
}
```

TODO 下面两种方式也可以通过编译；可以以后看看

```rs
fn foobar<'a, 'b, 'k>(set: &'b HashSet<&'a str>, key: &'a &'k str) -> Option<&'b &'a str> 
    where 'a : 'b, 'b : 'k
{
    set.get(key)
}

fn foobar<'a, 'b, 'k>(set: &'b HashSet<&'a str>, key: &&'k str) -> Option<&'b &'a str>
    where 'a: 'b, 'b: 'k, 'k: 'a
{
    set.get(key)
}
```