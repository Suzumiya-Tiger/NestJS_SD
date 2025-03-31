## main.ts 是负责启动 Nest 的 ioc 容器

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
async function bootstrap() {
    //注意要给 create 方法传入 NestExpressApplication 的泛型参数才有 useStaticAssets这些方法
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets('public', { prefix: '/static' });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

```

这个描述是指 main.ts 文件在 NestJS 框架中的作用。让我解释一下这句话的含义：

"main.ts 是负责启动 Nest 的 IoC 容器" 意思是 main.ts 文件是 NestJS 应用程序的入口点，它负责初始化和启动 NestJS 的依赖注入系统（IoC 容器）。

IoC（Inversion of Control，控制反转）是一种设计原则，在 NestJS 中通过依赖注入（DI）实现。NestJS 的 IoC 容器负责：

1. 创建和管理应用程序中的所有模块、控制器、服务等组件
2. 处理组件之间的依赖关系
3. 自动注入所需的依赖



在这个文件中，我们可以看到：

1. NestFactory.create(AppModule) - 这行代码创建了 NestJS 的应用实例，并传入了根模块 AppModule。这一步实际上启动了 NestJS 的 IoC 容器，它会：

- 扫描 AppModule 及其导入的所有模块

- 解析所有的依赖关系

- 实例化所有需要的服务、控制器等

- 建立完整的依赖注入树

1. bootstrap() 函数的调用启动了整个过程，使应用程序开始监听指定的端口。

简而言之，main.ts 是 NestJS 应用的引导文件，它负责初始化整个应用程序的依赖注入系统（IoC 容器），并启动 HTTP 服务器。这个文件是连接 NestJS 框架内部机制与外部世界的桥梁，是应用程序的真正入口点。

NestJS 的 IoC 容器是其核心特性之一，它使得代码更加模块化、可测试，并且遵循了依赖注入的设计模式，让开发者可以专注于业务逻辑而不是组件之间的依赖关系管理。



# Http的五种网络请求方式

## Get



get请求有携带参数和无携带参数两种方式。

如果携带参数，则分为两种参数携带方式，分别是params和query。

无参数请求的方式如下:
```ts
@Controller('api/person')
@Get()
findAll(){
    return this.personService.findAll()
}
```

这是最常见的请求方式。

### params

