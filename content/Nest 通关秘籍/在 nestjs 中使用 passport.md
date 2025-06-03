---
title: 在 nestjs 中使用 passport
description:
tags:
- 前端
create_date: 2025-06-03 15:04
---

在小册中只是讲解了如何使用 passport 和 @nestjs/passport 但是对于这个[使用案例](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2FQuarkGluonPlasma%2Fnestjs-course-code%2Ftree%2Fmain%2Fnest-passport)有一些疑问：

1. 在 AuthModule 中并没有导出 LocalStrategy, JwtStrategy 那为什么 app.controller.ts 中可以使用这些策略？
2. passport-local 只支持 post 吗？能不能从除了 body 的其他地方拿数据？

## 对于 passport 需要知道的

1. 根据[文档](https://www.passportjs.org/docs/)，要使用策略，那么就要使用 `passport.use` 去注册这些策略
2. 验证是调用 `passport.authenticate` 函数，但是这个函数并不是直接进行验证，而是返回一个函数，作为 express 中的中间件，只有当进入到对应路由并调用这个中间件时，才进行验证。

## 查看 @nestjs/passport 源码

### PassportStrategy

```ts
export function PassportStrategy<...>(
  Strategy: T,// 接收一个策略作为参数
  name?: string,// 指定这个策略的名字
  callbackArity?: true | number
): ... {
  // 将会返回这个抽象类
  abstract class StrategyWithMixin
    extends Strategy
    implements PassportStrategyMixin<TValidationResult>
  {
    // 抽象类可以声明抽象方法，抽象方法必须实现后才能实例化
    abstract validate(
      ...args: any[]
    ): TValidationResult | Promise<TValidationResult>;

    constructor(...args: any[]) {
      const callback = async (...params: any[]) => {...};

      if (callbackArity !== undefined) {...}
      super(...args, callback);

	  // 获取 passport
      const passportInstance = this.getPassportInstance();
      // 使用 passport.use 注册策略
      if (name) {
        passportInstance.use(name, this as any);
      } else {
        passportInstance.use(this as any);
      }
    }

    getPassportInstance() {
      return passport;
    }
  }
  return StrategyWithMixin;
}
```

根据上面的源码就可以看出来，当实例化 `StrategyWithMixin` 时（也就是执行 constructor 时），将会使用 `passport.use` 注册策略。

然后根据 nestjs 的策略：从 AppModule 出发，找到所有的 Module 并且实例化其所有的 provider 即使某些 provider 并没有使用，依然会进行实例化。

所以只要在 AppModule 的 imports 中声明了 AuthModule 那么 AuthModule 中的 providers 都会进行实例化，其中如果有某些 passport 策略，那么就会被注册到 passport 上。

### AuthGuard

如何使用：`@UseGuards(AuthGuard('jwt'))`

```ts
// AuthGuard 实际执行的就是这个函数；接收一个 type 参数，也就是不同的策略类型
function createAuthGuard(type?: string | string[]): Type<IAuthGuard> {
  // 最后将返回这个 Guard class
  class MixinAuthGuard<TUser = any> implements CanActivate {
    @Optional()
    @Inject(AuthModuleOptions)
    protected options: AuthModuleOptions = {};

    constructor(@Optional() options?: AuthModuleOptions) {...}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const options = {
        ...defaultOptions,
        ...this.options,
        ...(await this.getAuthenticateOptions(context))
      };
      const [request, response] = [this.getRequest(context),this.getResponse(context)];
      // *重点在这里
      const passportFn = createPassportContext(request, response);
      // 执行这个函数就会进行验证。
      const user = await passportFn(
        type || this.options.defaultStrategy,
        options,
        (err, user, info, status) =>
          this.handleRequest(err, user, info, context, status)
      );
      request[options.property || defaultOptions.property] = user;
      return true;
    }

    getRequest<T = any>(context: ExecutionContext): T {
      return context.switchToHttp().getRequest();
    }
    getResponse<T = any>(context: ExecutionContext): T {
      return context.switchToHttp().getResponse();
    }

    handleRequest(err, user, info, context, status): TUser {
      if (err || !user) {
        throw err || new UnauthorizedException();
      }
      return user;
    }

    getAuthenticateOptions(
      context: ExecutionContext
    ): Promise<IAuthModuleOptions> | IAuthModuleOptions | undefined {
      return undefined;
    }
  }
  const guard = mixin(MixinAuthGuard);
  return guard as Type<IAuthGuard>;
}
// 重点, 与源码不完全一致，修改了一点使其更容易理解
const createPassportContext = (request: any, response: any) => {
  // 返回一个函数
  return (type: string | string[], options: any, callback: Function) =>  
  {
    // 执行这个函数将会首先执行 passport.authenticate 获取 returnFn 然后传入参数，进行验证。
    return new Promise<void>((resolve, reject) => {  
      const returnFn = passport.authenticate(type, options, (err, user, info, status) => {  
        try {  
          request.authInfo = info;  
          return resolve(callback(err, user, info, status));  
        } catch (err) {  
          reject(err);  
        };  
      });  
      return returnFn(request, response, (err: any) => (err ? reject(err) : resolve()))  
    })  
  }  
}
```

根据上面的源码，可以知道， @nestjs/passport 并不是使用在 express 中注册中间件进行验证，而是使用了 guard。

## 总结

所以上面的问题已经有答案了

1. 只需要使用 PassportStrategy 创建一个策略，然后把它放到 Module 的 providers 中，再把 Module 放到 AppModule 中。当启动应用时，这个策略就会被注册到 passport 上。要使用的话，直接使用 AuthGuard 即可。
2. 这个问题，可以理解为如何在 nestjs 中配置 passport 的各项策略，上面 PassportStrategy 的源码也说明了，只需要在 constructor 中使用 super 传递配置，这些配置将传递给策略本身。如下例所示：

```ts
import { ExtractJwt, Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    // 在这里传入了配置。
    super({
      usernameField: 'email',
    });
  }

  // passport-local 默认从 req.body || req.query 中获取 username 和 password 但是如果要从其他地方，比如 headers 中获取，就要改写 authenticate 函数
  authenticate(req: e.Request, options?: any) {
    const { username, password } = req.headers;
    req.body = req.body || {};
    req.body.email = username;
    req.body.password = password;
    super.authenticate(req, options);
  }

  async validate(username: string, password: string) {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

补充：

passport 将信息放到 req.user 上，如果要修改，建议添加中间件，手动处理，而且建议不要删掉 req.user 可能有策略依赖这个属性。