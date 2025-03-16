# 面向切面编程(AOP)

后端框架基本都是 MVC 的架构。

MVC 是 Model View Controller 的简写。MVC 架构下，请求会先发送给 Controller，由它调度 Model 层的 Service 来完成业务逻辑，然后返回对应的 View。

![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/580375b654ac445cb2cd07784824104c~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

在这个流程中，Nest 还提供了 AOP （Aspect Oriented Programming）的能力，也就是面向切面编程的能力。

AOP 是什么意思呢？什么是面向切面编程呢？

一个请求过来，可能会经过 Controller（控制器）、Service（服务）、Repository（数据库访问） 的逻辑：

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/109025024af543febb44ca2a70ca9f92~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

如果想在这个调用链路里加入一些通用逻辑该怎么加呢？比如日志记录、权限控制、异常处理等。

容易想到的是直接改造 Controller 层代码，加入这段逻辑。

这样可以，但是不优雅，因为这些通用的逻辑侵入到了业务逻辑里面。能不能透明的给这些业务逻辑加上日志、权限等处理呢？

那是不是可以在调用 Controller 之前和之后加入一个执行通用逻辑的阶段呢？

比如这样：

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9f99087120e847eab901738bf8504d21~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

是不是就和切了一刀一样？

这样的横向扩展点就叫做切面，这种透明的加入一些切面逻辑的编程方式就叫做 AOP （面向切面编程）。

**AOP 的好处是可以把一些通用逻辑分离到切面中，保持业务逻辑的纯粹性，这样切面逻辑可以复用，还可以动态的增删。**

其实 Express 的中间件的洋葱模型也是一种 AOP 的实现，因为你可以透明的在外面包一层，加入一些逻辑，内层感知不到。

而 Nest 实现 AOP 的方式更多，一共有五种，包括 Middleware、Guard、Pipe、Interceptor、ExceptionFilter。



## 中间件Middleware

中间件是 Express 里的概念，Nest 的底层是 Express，所以自然也可以使用中间件，但是做了进一步的细分，分为了全局中间件和路由中间件。

全局中间件就是这样，在main.ts中写入:

```TS
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NextFunction, Request, Response } from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(function (req: Request, res: Response, next: NextFunction) {
    console.log('before', req.url);

    next();
    console.log('after', req.url);
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

```

执行流程：

1. 当请求到达时，首先打印before和请求URL

1. 调用next()将控制权传递给下一个中间件

1. 下一个中间件完成处理并返回控制权

1. 然后打印after和请求URL

### 中间件执行顺序图示

```tcl
请求 → 中间件1开始 → next() → 中间件2开始 → next() → 路由处理函数 → 中间件2结束 → 中间件1结束 → 响应
```

### 重要特性

1. 洋葱模型：中间件执行类似洋葱层结构，请求先穿过所有中间件的"前半部分"(next()之前的代码)，再穿过"后半部分"(next()之后的代码)。
2. 流程控制：

- 不调用next()：请求处理在当前中间件终止

- 调用next()：继续执行下一个中间件

- 调用next(err)：跳过后续常规中间件，直接进入错误处理中间件

3. 终止请求：中间件可以通过res.send()、res.end()或res.json()等方法结束请求，不再执行后续中间件



### 后续实现

我们可以在具体的控制器的路由中添加打印:

```TS
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    console.log('handler...');

    return this.appService.getHello();
  }
}

```



![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/46864de7f8774585b6aab4f69e80f2bd~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=826&h=454&s=89639&e=png&b=181818)



多添加几个路由:
```TS
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}


  @Get('aaa')
  aaa(): string {
    console.log('aaa handler...');

    return 'aaa';
  }

  @Get('bbb')
  bbb(): string {
    console.log('bbbhandler...');

    return 'bbb';
  }
}

```

浏览器一次访问这两个网址，可以看到中间件逻辑都执行了，且按照next()的前后顺序严格执行。

![image-20250316203358568](/Users/heinrichhu/前端项目/NestJS_SD/05_aop-test/image-20250316203358568.png)



![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c77913aa1f9f41d6b91c8b17d7a57b9a~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=766&h=652&s=31772&e=png&b=ffffff)



这种可以给在 handler 前后动态增加一些可复用的逻辑，就是 AOP 的切面编程的思想。

除了全局中间件，Nest 还支持路由中间件。

用 nest cli 创建一个路由中间件：

`nest g middleware log --no-spec --flat`

```javascript
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LogMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    console.log('before2', req.url);
    next();
    console.log('after2', req.url);
  }
}

```



在app.module.ts中应用该logmiddleware:

```javascript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LogMiddleware } from './log.middleware';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule{

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogMiddleware).forRoutes('*');
  }

}


```

最后我们可以看到结果很类似于之前学习Koa的“洋葱模型”:
![image-20250316232729718](/Users/heinrichhu/前端项目/NestJS_SD/05_aop-test/assets/image-20250316232729718.png)

### 总结

1. 先从全局中间件过，即定义在main.ts启动器的app.use()内部的next()之前的方法穿梭一次。
2. 再从路由中间件过，即从log.middleware.ts中的use中的next()之前穿梭一次，切记需要在app.module.ts中继承和配置LogMiddleware。
3. 最后抵达app.controller.ts中对应路由的实现方法中。
4. 以此类推，执行next()后面的步骤，层层穿梭出来，和洋葱模型同理。



注意，这种方式大多数用于在抵达指定路由前进行数据处理或者通用配置，主要依赖于middleware建立的路由中间件，和express，koa的处理方式非常类似。





## Guard



Guard就是路由守卫，它的目的是为了在调用某个controller之前判定权限，通过返回boolean数据判定是否允许客户端请求放行:
![img](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9e9a9eee8aa74881b6789dd753916202~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=1008&h=270&s=23833&e=png&b=ffffff)

先通过 `nest g guard login --no-spec --flat`生成login.guard.ts:

```javascript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class LoginGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log('login check');

    return false;
  }
}

```

然后我们可以在controller里面随机抽取一个路由幸运儿来实现Guard路由守卫:

```TS
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { LoginGuard } from './login.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    console.log('handler...');

    return this.appService.getHello();
  }

  @Get('aaa')
  @UseGuards(LoginGuard)
  aaa(): string {
    console.log('aaa handler...');

    return 'aaa';
  }

  @Get('bbb')
  bbb(): string {
    console.log('bbbhandler...');

    return 'bbb';
  }
}

```



这个时候/aaa对应的路由就不允许你随便访问了，因为我们已经在guard直接返回了false。

`@Guard`通过实现canactive方法来决定是否允许访问通过。

这意味着我们无需对controller进行前置处理，而是按照流程和规范对controller透明地进行了权限判断的前置约束，这是为什么需要AOP的原因。

同时Guard支持全局启用:
![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/36bef5bfec3e4fba9808ba10a9994b2b~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=760&h=678&s=134490zhe&e=png&b=1f1f1f)



这会使得所有路由都必须应用这个Guard，当然你也可以选择在根应用的module里面来处理，这里就是AppModule:

```javascript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LogMiddleware } from './log.middleware';
import { APP_GUARD } from '@nestjs/core';
import { LoginGuard } from './login.guard';
@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: LoginGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogMiddleware).forRoutes('*');
  }
}

```

### 为什么全局Guard的provide是指定的APP_GUARD?

在NestJS中，使用APP_GUARD作为provide值有特殊意义。APP_GUARD是NestJS框架从@nestjs/core包中提供的一个特殊标记(token)，它告诉NestJS这个provider应该被注册为全局守卫(Guard)。

#### 原因解释

1. 依赖注入系统的标识：APP_GUARD是一个用于NestJS依赖注入系统的标识符，当框架启动时，它会寻找使用这个标识符注册的所有provider，并将它们注册为全局守卫。

1. 模块内注册全局守卫：使用APP_GUARD允许你在任何模块内注册全局守卫，而不必使用其他方法。这有助于保持代码的模块化和可维护性。

1. 解决循环依赖问题：当守卫需要注入来自同一模块的其他服务时，使用APP_GUARD可以避免潜在的循环依赖问题。

#### 与其他注册全局守卫方式的比较

除了使用APP_GUARD，你还可以通过以下方式注册全局守卫：



这两种方式有什么区别？
只要仔细观察就会发现,main.ts中的LoginGuard()是new出来的，这意味着其不受IOC容器的存储和控制。

但是用provide的形式声明的Guard则在IOC容器的里面，可以注入别的provider:

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/97d3ed989e59453d95e6bb2bdf6b55bc~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=528&h=408&s=41843&e=png&b=1f1f1f)

并且login.guard.ts中，我们可以直接在CanActive里面注入AppService,无需通过module形式，先在需要导出的service的module通过exports指定导出的service，然后再在对应的module导入指定的module来使用service:

```TS
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppService } from './app.service';

@Injectable()
export class LoginGuard implements CanActivate {
  @Inject(AppService)
  private appService: AppService;
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log('login check', this.appService.getHello());

    return false;
  }
}

```

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/dae1a24e2dca4f80ac2e312ad89dfc13~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=582&h=504&s=85424&e=png&b=191919)

所以如果需要注入别的provider的时候，需要使用第二种全局Guard的形式来实现IOC容器内部的service调用。

### Interceptor

这个也是一个拦截器，但是和Guard的区别在于，它既可以在Controller方法前面加入逻辑，也可以在Controller方法后面加入逻辑。

![img](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3a981ca0f64c4e37be0475d95366a0ef~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=1042&h=246&s=27755&e=png&b=ffffff)



































