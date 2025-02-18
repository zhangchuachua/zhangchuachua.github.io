> [!important] Rust 中的 Async/Await 其实也是一种语法糖，与 javascript 中的一样，并且实现原理都是基于 generator 的实现；

```rs
async fn example() {
    println!("Hello");
    let future = async {
        println!("World");
    };
    future.await;
    println!("Done");
}
```

编译后会生成类似一下伪代码的状态机；

```rs
enum ExampleState {
    Start,
    AwaitingFuture,
    Done,
}

struct Example {
    state: ExampleState,
    future: Option<impl Future<Output = ()>>,
}

impl Future for Example {
    type Output = ();
    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        loop {
            match self.state {
                ExampleState::Start => {
                    println!("Hello");
                    let future = async { println!("World"); };
                    self.future = Some(future);
                    self.state = ExampleState::AwaitingFuture;
                }
                ExampleState::AwaitingFuture => {
                    if let Some(future) = self.future.as_mut() {
                        match Pin::new(future).poll(cx) {
                            Poll::Ready(_) => {
                                self.future = None;
                                self.state = ExampleState::Done;
                            }
                            Poll::Pending => {
                                return Poll::Pending;
                            }
                        }
                    }
                }
                ExampleState::Done => {
                    println!("Done");
                    return Poll::Ready(());
                }
            }
        }
    }
}
```