---
title: Nest 小笔记
description:
tags:
- 前端
create_date: 2025-06-19 10:18
filename: nest-notes
---

## @nestjs/jwt 声明为全局模块

当使用 `JwtModule.register` 时直接传入 `global: true` 即可。

```ts
JwtModule.register({
	global: true,
	secret: 'xxx'
}),
```

当使用 `JwtModule.registerAsync` 时，不能在 `useFactory` 中返回值（也就是 jwtOptions）中使用 `global: true` ，如下所示。

```ts
JwtModule.registerAsync({  
  global: true,  
  inject: [ConfigService],  
  useFactory(configService: ConfigService) {  
    return {
      // global: true 放在这里无效
      secret: configService.get('JWT_SECRET'),  
    };  
  },  
})
```