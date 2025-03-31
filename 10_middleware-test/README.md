# Nest的Middleware

## middleware的应用

首先我们还是来定义一下middleware:
```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class AaaMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    console.log('brefore');
    next();
    console.log('after');
  }
}

```

然后在app.module.ts这个module层级引入middleware:

```typescript
import { AaaMiddleware } from './aaa.middleware';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule{

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AaaMiddleware).forRoutes('*');
  }
}


```

### **为什么需要 configure(consumer: MiddlewareConsumer)？**

​	1.	**NestJS 采用模块化架构**

​	•	中间件是针对特定模块或路由生效的，手动注册可以确保只在需要的地方使用，而不会影响整个应用。

​	•	你可以选择性地对**部分路由**或**特定模块**应用中间件，而不是全局应用。

​	2.	**避免不必要的全局作用域**

​	•	NestJS 的中间件默认不会全局生效，而是作用于指定的 routes，这样可以提高性能，避免影响无关的 API。

​	•	例如：

```typescript
consumer.apply(AaaMiddleware).forRoutes('user');
```

这样 AaaMiddleware 只对 /user 相关的路由生效，而不是所有请求。

这里我们还可以对forRoutes进行精细化的配置:
aaa.module.ts:

```typescript
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AaaMiddleware } from './aaa.middleware';
@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 重新指定middleware应用的路由
    consumer
      .apply(AaaMiddleware)
      .forRoutes({ path: 'Hello/*path', method: RequestMethod.GET });
    consumer
      .apply(AaaMiddleware)
      .forRoutes({ path: 'world/*path', method: RequestMethod.GET });
  }
}

```

然后在app.controller.ts里面写入多个handler，这里不再赘述，看代码就行。

​	3.	**支持链式调用和多个中间件**

​	•	你可以在 consumer.apply() 里链式注册多个中间件，提高可读性：

```typescript
consumer.apply(AuthMiddleware, LoggerMiddleware).forRoutes('user');
```

​	•	这样可以在**不同的路由应用不同的中间件**，让代码更具可维护性。



### **如何简化 Middleware 注册？**



**使用 app.use() 在 main.ts 里全局注册**

如果你的中间件是全局的，可以直接在 main.ts 里注册，**不需要在 AppModule 里配置**：

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AaaMiddleware } from './aaa.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(new AaaMiddleware().use); // 直接全局注册中间件
  await app.listen(3000);
}
bootstrap();
```

**适用场景**：

​	•	适用于 **日志、CORS、异常处理** 这类全局中间件。

​	•	不适用于 **需要访问 NestModule 依赖** 的中间件。



## midlleware的依赖注入

为什么middleware要做成class？就是为了实现依赖注入，我们可以尝试把可以注入的依赖进行注入:
```typescript
import { AppService } from './app.service';
import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class AaaMiddleware implements NestMiddleware {
  @Inject(AppService)
  private readonly appService: AppService;

  use(req: Request, res: Response, next: () => void) {
    console.log('brefore');
    console.log('-------' + this.appService.getHello());
    next();
    console.log('after');
  }
}

```



此外，middleware 里有个 next 参数，而 Nest 还有个 @Next 装饰器，这俩的区别是什么呢？

middleware 的 next 参数就是调用下一个 middleware 的，这个很好理解。

而 @Next 装饰器是调用下一个 handler 的：

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4109a967aac045079f337e77dc94b59c~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

但如果是这样一个 handler，它就不返回值了。

这个和加上 @Response 装饰器的时候的效果一样。

因为 Nest 认为你会自己返回响应或者调用下个 handler，就不会处理返回值了。

如果依然想让 Nest 把函数返回值作为响应，可以这样写：

![img](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d080ce7f3a4e4e3193476ba78f938a21~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

当然，传入 Next 参数的时候，一般是不需要在这里响应的，一般是调用下个 handler 来响应：

![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9313211d72a44cf7a1dc899932eda3f4~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)



Nest 的 middleware 和 interceptor 都是在请求前后加入一些逻辑的，这俩区别是啥呢？

![img](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/013d75fb98f045ecb06aee78c6689ad6~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

interceptor 是能从 ExecutionContext 里拿到目标 class 和 handler，进而通过 reflector 拿到它的 metadata 等信息的，这些 middleware 就不可以。

再就是 interceptor 里是可以用 rxjs 的操作符来组织响应处理流程的：

![img](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2b5826ac6aec4c0ea2ebb3fba0d69424~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

middleware 里也不可以。

它们都是 Nest AOP 思想的实现，但是 interceptor 更适合处理与具体业务相关的逻辑，而 middleware 适合更通用的处理逻辑。

