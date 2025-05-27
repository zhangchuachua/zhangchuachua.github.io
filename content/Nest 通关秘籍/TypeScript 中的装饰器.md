---
title: TypeScript 中的装饰器
description:
tags:
- 前端
- TypeScript
create_date: 2025-05-27 12:23
---

Nest.js 中大量采用了装饰器，所以要学习 Nest.js 那么一定要知道装饰器。

## 在 TypeScript 中开启装饰器

目前，装饰器提案已经到了 stage3 阶段，并且 TypeScript 5 后默认支持了 stage3 阶段的装饰器。

> stage3 阶段的装饰器与 stage2 语法变化很大。

但是截止 2025-05-27 nestjs 中使用的依然是 stage2 阶段的装饰器，所以以下内容都是基于 stage2 的装饰器。

重点是下面两个选项：

- `experimentalDecorators`: 添加对装饰器的语法支持。
- `emitDecoratorMetadata`: 开启这个选项后，使用了装饰器的内容都会自动添加一些元数据，详情见[文档](https://www.typescriptlang.org/tsconfig/#emitDecoratorMetadata)。如下所示：
	- `design:type` 被装饰的内容的类型
	- `design:paramtypes` 如果被装饰的内容是一个函数，那么这个元数据将会是参数的类型数组
	- `design:returntype` 如果被装饰的内容是一个函数，那么这个元数据将会是函数的返回值类型。

> Nest.js 中大量使用了 metadata 所以一定要开启 emitDecoratorMetadata 选项。要获取或设置 metadata 的话，需要使用 [reflect-metadata](https://github.com/microsoft/reflect-metadata) 三方库。

以下是示例

```ts
import 'reflect-metadata';

// 这个装饰器什么也没干
function Example(...args: any[]) {}

class Demo {
	 @Example
	 public foo(bar: number):string {
		 return `foo-${bar}`;
	 }
}

const demo = new Demo();

// 即使上面的装饰器什么也没干，都会插入这些元数据
console.log(Reflect.getMetadata('design:type', demo, 'foo')); // 打印 Function 构造函数
console.log(Reflect.getMetadata('design:paramtypes', demo, 'foo'));// 打印 [Number]
console.log(Reflect.getMetadata('design:returntype', demo, 'foo'));// 打印 String
```

直接从 `Demo.prototype` 获取也是可以的，因为这三个元数据就是直接添加到 prototype 上的（可以复习一下 new 的原理）

```ts
console.log(Reflect.getMetadata('design:type', Demo.prototype, 'foo')); // 打印 Function 构造函数
console.log(Reflect.getMetadata('design:paramtypes', Demo.prototype, 'foo'));// 打印 [Number]
console.log(Reflect.getMetadata('design:returntype', Demo.prototype, 'foo'));// 打印 String
```

注意，添加这些元数据仅仅发生在编译阶段，也就是说是静态的。假设修改 foo 函数，去掉返回的类型的话，那么就会是 undefined：

```ts
// 这个装饰器什么也没干
function Example(...args: any[]) {}

class Demo {
	 @Example
	 public foo(bar: number) {// 去掉这里的返回值类型
		 return `foo-${bar}`;
	 }
}

console.log(Reflect.getMetadata('design:returntype', demo, 'foo'));// 打印 undefined
```

## class 装饰器

```ts
function classDecorator<T extends { new (...args: any[]): {} }>(target: T) {...}
```

class 装饰器只有一个参数，这个参数是 class 的 **`constructor`**.

### 为 class 属性设置默认值：

```ts
// 接收一个对象，返回一个装饰器。
function defaultValue(obj: Record<string | symbol, any>) {  
  return function decorator<T extends { new(...args: any[]): {} }>(target: T) {
    return class extends target {  
      constructor(...args: any[]) {  
        super(args);  
        for (const [key, value] of Object.entries(obj)) {  
          if (this[key] === undefined) {  
            this[key] = value;  
          }  
        }  
      }  
    }  
  }  
}

@defaultValue({ name: 'default name' })  
class Demo {  
  name: string;  
}  
  
const demo = new Demo();  
console.log(demo.name);// 打印 default name
```

### 为 class 设置元数据

```ts
function AddVersion(version: string) {  
  return function decorator<T extends { new(...args: any[]): {} }>(target: T) {  
    Reflect.defineMetadata('version', version, target.prototype);  
  }  
}

@AddVersion('1.0.0')  
class Demo {  
  name: string;  
}  
  
const demo = new Demo();  
console.log(Reflect.getMetadata('version', demo)); // 打印 1.0.0
// 这样就可以根据不同的 version 进行不同的操作了。
```

## 属性装饰器

```ts
function propertyDecorator(target: any, propertyKey: string) {  
  console.log('propertyDecorator');
  console.log(target === Demo.prototype);  
  console.log(propertyKey);  
}  
  
class Demo {
  @propertyDecorator  
  name: string;  
  
  constructor() {  
    this.name = 'demo';  
  }  
}
```

属性装饰器接收两个参数

- 第一个参数是 class 的 prototype ，注意是 prototype ，与 class 装饰器不同。
- 第二个参数是 属性名。

### 默认值（不推荐）

```ts
function propertyDecorator(value: any) {  
  return function (target: any, propertyKey: string) {
    // 可以使用给 Demo.prototype 赋值或者代理 Demo.prototype 两种方式
    if (target[propertyKey] === undefined) {  
      target[propertyKey] = value;  
    }  
  }  
}  

class Demo {  
  @propertyDecorator('default name')  
  name: string;  
}  

console.log(new Demo().name);// ES2022 之前打印 default name， ES2022(含)之后打印 undefined
```

为什么不推荐呢，根据上面的打印内容，可以发现，ES2022(含)后默认值并不生效，这是因为 ES2022 后编译 class 有所区别。

ES2022 之前， class Demo 将会被编译为: 

```js
class Demo {}
```

此时实例化 Demo 的话 `const demo = new Demo()` demo 中并没有值，所以当我们访问 `demo.name` 时，将会去原型链上获取；然后又因为修改为了 Demo.prototype 所以才能拿到默认值。

可是在 ES2022(含)后，class Demo 将会被编译为:

```js
class Demo {
	name;
}
```

这样实例化 Demo :`const demo = new Demo()` 此时的 demo 值为： `{ name: undefined }` 所以当访问 `demo.name` 时，将会直接返回 undefined，并不会去原型链上找。

这样的话，只有劫持 constructor 才能控制实例化的内容，属性装饰器做不到这一点的，所以并不推荐使用属性装饰器设置值。

### 验证

```ts
function Max(value: number) {  
  return function (target: any, key: string) {  
    const existing: Map<string, any> = Reflect.getMetadata('validator', target) || new Map();  
    existing.set(`max-${key}`, value);  
    Reflect.defineMetadata('validator', existing, target);  
  }  
}  
  
function Min(value: number) {  
  return function (target: any, key: string) {  
    const existing: Map<string, any> = Reflect.getMetadata('validator', target) || new Map();  
    existing.set(`min-${key}`, value);  
    Reflect.defineMetadata('validator', existing, target);  
  }  
}  

// 仅仅作为参考， nestjs 中用到的 class-validator 大概就是这个原理。
function validation(obj: any) {  
  const validator = Reflect.getMetadata('validator', obj);  
  if (!validator) {  
    return;  
  }  
  const errors: string[] = [];  
  
  for (const [key, value] of validator) {  
    const [type, field] = key.split('-');  
    switch (type) {  
      case 'max':  
        if (obj[field] > value) {  
          errors.push(`${field} should be less than ${value}`);  
        }  
        break;  
      case 'min':  
        if (obj[field] < value) {  
          errors.push(`${field} should be greater than ${value}`);  
        }  
        break;  
    }  
  }  
  return errors;  
}  
  
class User {  
  @Max(10)  
  @Min(1)  
  age: number = 0;  
}  
  
const ok = validation(new User());  
console.log(ok);
```

> [!tip] 装饰器的执行顺序：从右到左，从下到上。像是上面的 Max 和 Min ，就是先执行 @Min 再执行 @Max

## 方法装饰器

```ts
function methodDecorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {  
  console.log('methodDecorator');  
  console.log(target);  
  console.log(propertyKey);  
  console.log(descriptor);  
}
```

方法装饰器接收三个参数：

- 第一个参数，class 的 prototype
- 第二个参数，方法名称
- 第三个参数：属性描述符，详细的可以看 MDN 中的 [Object.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty); 注意 descriptor.value 就是方法本体函数。

### 性能监控

```ts
function methodDecorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {  
  const originalMethod = descriptor.value;  
  descriptor.value = function (...args: any[]) {  
    console.time(`${propertyKey}`);  
    originalMethod.apply(this, args);  
    console.timeEnd(`${propertyKey}`);  
  };  
}

class Demo {  
  name: string;  
  
  @methodDecorator  
  test() {  
    const now = Date.now();  
    while (Date.now() - now < 1000) {  }
  }  
}

new Demo().test();
```

### 权限控制

```ts
function CheckPermission(role: string) {
  return function (
    target: any,
    methodName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      if (this.currentUser?.role !== role) {
        throw new Error("权限不足！");
      }
      return originalMethod.apply(this, args);
    };
  };
}

class AdminPanel {
  currentUser = { role: "user" }; // 假设当前用户是普通用户

  @CheckPermission("admin")
  deleteUser() {
    console.log("用户已删除");
  }
}

const panel = new AdminPanel();
panel.deleteUser(); // 抛出错误：权限不足！
```

## 参数装饰器

```ts
function parameterDecorator(target: any, propertyKey: string, parameterIndex: number) {  
  console.log('parameterDecorator');  
  console.log(target);  
  console.log(propertyKey);  
  console.log(parameterIndex);  
}
```

参数装饰器有三个参数：

1. 如果装饰器用在 constructor 中，那么这个参数为 constructor。如果装饰器用在普通函数中，那么这个参数为 class 的 prototype。
2. 方法的名称，注意是方法名字，不是参数的名字
3. 函数的索引

### 依赖注入

```ts
function Inject(injectKey: string) {  
  return function (target: any, propertyKey: string, parameterIndex: number) {  
    console.log('Inject start', target === Demo.prototype, propertyKey, parameterIndex, 'Inject end');  
    const existingInjections = Reflect.getMetadata('injections', target) || [];  
    existingInjections[parameterIndex] = injectKey;  
    Reflect.defineProperty(target, 'injections', existingInjections);  
  }  
}  

const injects = new Map([  
  [  
    'logger',  
    {  
      log: function (message: string) {  
        console.log('[~~logger~~]: ', message);  
      }  
    }  
  ]  
])
  
  
class Demo {  
  name: string = 'demo';  
  constructor(@Inject('logger') private logger: any) {  
  }  
  logName() {  
    this.logger.log(this.name);  
  }  
}  
  
// 实例化 Demo 时，分析它需要的依赖，并且注入进去。这里只是示例，与框架中的代码类似  
// 分析依赖  
const injections = Reflect.getMetadata('injections', Demo) || [];  
// paramTypes 才是完整的参数数组  
const paramTypes = Reflect.getMetadata('design:paramtypes', Demo);  
// 遍历依赖，并注入依赖  
const args = paramTypes.map((item, index) => {  
  // 查看这个依赖是否是注入的依赖，如果是注入的依赖就  
  if(injections[index]) {  
    const injectKey = injections[index];  
    // 从 injects 中拿到注入的依赖  
    return injects.get(injectKey);  
  } else {  
    // 如果不是注入的依赖，就进行其他的处理，视具体情况而定，例如从另一个 map 中拿  
  }  
})  
// 实例化  
const demo = new Demo(...args);
demo.logName(); // 顺利打印
```

## 访问器装饰器

```ts
function AccessorDecorator(target: any,propertyKey: string,descriptor: PropertyDescriptor) {
	console.log(target, propertyKey, descriptor);
};
```

参数与 方法装饰器 类似

1. class 的 prototype
2. 方法名称
3. 属性描述符

主要是使用不同，访问器装饰器，只能装饰访问器，也就是 `get()` 或 `set()` 这样的函数。

### 自动缓存计算结果

```ts
function CacheResult() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalGetter = descriptor.get!;
    let cachedValue: any;

    descriptor.get = function () {
      if (!cachedValue) {
        console.log("计算并缓存结果...");
        cachedValue = originalGetter.call(this);
      }
      return cachedValue;
    };
  };
}

class ExpensiveCalculator {
  private _result: number = 0;

  @CacheResult()
  get result() {
    // 模拟复杂计算
    this._result = 42;
    return this._result;
  }
}

const calc = new ExpensiveCalculator();
console.log(calc.result); // 输出 "计算并缓存结果..." 和 42
console.log(calc.result); // 直接返回 42，不再计算
```