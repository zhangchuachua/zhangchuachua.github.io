这一节主要讲的就是标题那样，如何给动态分发的特征对象传递生命周期；

如下代码

```rs
trait Foo {}

struct FooImpl<'a> {
    s: &'a [u32],
}

impl<'a> Foo for FooImpl<'a> {}

// 如果仅用 Box<dyn Foo> 那么就不能给 FooImpl 传递生命周期了，所以就有了一个 Box<dyn Foo + 'a> 的语法；
// 这里是必须加 'a 的，因为默认是 Box<dyn Foo + 'static> 这样；表示 dyn Foo 至少在 'static 都存活，但是这样的话 s 存活不了那么久，会引起悬垂引用，就会报错；
fn foo<'a>(s: &'a [u32]) -> Box<dyn Foo + 'a> {
    Box::new(FooImpl { s })
}

fn main() {}
```

> [!important]
> 
> `Box<dyn Foo + ‘a>` 表示这个动态分发的对象，在 `‘a` 这个生命周期内都存活；  
>   
> 注意：  
> `Box<dyn Foo + ‘a + 'b>` 这样的语法是错误的，只能 + 一个生命周期；因为上面已经说了，**描述的是这个对象的生命周期，并不是把生命周期传递给 FooImpl 拿去用；**  
>   
> **再注意：**  
> `**Box<dyn for<'any> Foo + 'any>**` **这个语法也是错误的；编译器直接会报错** `**'any**` **这个生命周期是未声明的**

如果不用 Box 的话，就好办了

```rs
fn foo<'a>(s: &'a [u32]) -> &'a dyn Foo {...} // 这样即可
```

那么如果 FooImpl 需要两个生命周期呢？

```rs
trait Foo {}

struct FooImpl<'a, 'b> {
    s: &'a [u32; 1],
    a: &'b [i32; 1],
}

impl<'a, 'b> Foo for FooImpl<'a, 'b> {}

// 1. 只能传递一个生命周期到 Box<> 里面；
// 2. 'b: 'a 这个约束一定要有，因为传递给 Box<> 的只能是更小的那个
// 3. 使用的是更小的那个生命周期；也就是 'a；也很好理解：如果用 'b 那么 dyn Foo 还没有被释放的时候 s 已经被释放了，造成了悬垂引用
fn foo<'a, 'b: 'a>(s: &'a [u32; 1], a: &'b [i32; 1]) -> Box<dyn Foo + 'a> {
    Box::new(FooImpl { s, a })
}

fn main() {}
```