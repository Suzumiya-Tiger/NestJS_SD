# 使用多种provider，灵活注入对象

在模块中，provide不只是提供service，而是允许多种类型的服务在此注入。

## useClass

比如`providers:[AppService]`,这只不过是一种简写，实际上的完整版定义如下:

```javascript
providers:[{
  provide:AppService,
  useClass:AppService
}]
```

通过 provide 指定 token，通过 useClass 指定对象的类，Nest 会自动对它做实例化后用来注入。

```javascript
@Inject(AppService)
private readonly appService: AppService;

```

也许你难以相信，但是事实上AppService是一个token，这个class本身就是一个token。

如果你愿意，可以在Providers中的详细定义中，在provide写入 `'app_service'`，它也是个字符串。但如果这样子写的话，就意味着你在AppContoller里面的类型注入需要通过@Inject指定该字符串:

![img](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fb6d3baa60634eb1845d6759e90c51c5~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

也就是说只要通过UserClass指定了AppService作为class，那么在其他应用该实例的控制器中，它会自动导入该实例并且注入到控制器中:

![image-20250316172507554](/Users/heinrichhu/前端项目/NestJS_SD/04_custom-provider/image-20250316172507554.png)



useClass 的方式由 IoC 容器负责实例化，我们也可以用 useValue、useFactory 直接指定对象。

## useValue

如果你希望在注入这个类的时候，顺便获取一些自定义的参数，那么你可以在Provider注入类的时候，顺便定义useValue:

```js
{
    provide: 'person',
    useValue: {
        name: 'aaa',
        age: 20
    }
}

```

使用 provide 指定 token，使用 useValue 指定值。

然后在对象里注入它：

![img](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/861e16c386de4bc783d0c617414afc1d~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

## useFactory

最牛逼的是useFactory可以支持通过注入参数来注入别的Provider:

```javascript
    {
      provide: 'person2',
      useFactory(person: { name: string }, appService: AppService) {
        return {
          name: person.name,
          desc: appService.getHello(),
        };
      },
      // inject代表依赖注入
      inject: ['person', AppService],
    },
```

注意这里引入AppService需要你写一个inject来声明两个token，一个是字符串token的person，一个是classtoken的AppService。

通过注入这两个token，你就可以直接获取他们的实例上的属性或者方法，在其他控制器中使用。

useFactory 是一个工厂函数，用于动态创建提供者。

inject 数组用于指定这个工厂函数所依赖的其他提供者。

NestJS 在调用 useFactory 时，会按照 inject 数组中指定的顺序依次将这些依赖项作为参数传递给 useFactory 函数。因此，为了确保每个依赖项能正确传递到对应的参数位置，useFactory 函数参数的顺序必须和 inject 数组中依赖项的顺序一致。

然后在app.controller中:

```JS
import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('person') private readonly person: { name: string; age: number },
    @Inject('person2') private readonly person2: { name: string; desc: string },
  ) {}

  @Get()
  getHello(): string {
    console.log('person', this.person);
    console.log('person2', this.person2);

    return this.appService.getHello();
  }
}

```

可以看到，在调用 useFactory 方法的时候，Nest 就会注入这两个对象：

![image-20250316175644200](/Users/heinrichhu/前端项目/NestJS_SD/04_custom-provider/image-20250316175644200.png)



### 异步useFactory

useFactory支持异步:
```js
    {
      provide: 'person3',
      async useFactory(person: { name: string }, appService: AppService) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return {
          name: person.name,
          desc: appService.getHello(),
        };
      },
      inject: ['person', AppService],
    },
```

Nest 会等拿到异步方法的结果之后再注入：

![img](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/feec815403a24b4a876edebc9d766786~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

## 总结

一般情况下，provider 是通过 @Injectable 声明，然后在 @Module 的 providers 数组里注册的 class。

默认的 token 就是 class，这样不用使用 @Inject 来指定注入的 token。

但也可以用字符串类型的 token，不过注入的时候要用 @Inject 单独指定。

除了可以用 useClass 指定注入的 class，还可以用 useValue 直接指定注入的对象。

如果想动态生成对象，可以使用 useFactory，它的参数也注入 IOC 容器中的对象，然后动态返回 provider 的对象。

如果想起别名，可以用 useExisting 给已有的 token，指定一个新 token。

灵活运用这些 provider 类型，就可以利用 Nest 的 IOC 容器中注入任何对象。



# 全局模块和生命周期

## 全局模块

模块导出 provider，另一个模块需要 imports 它才能用这些 provider。

但如果这个模块被很多模块依赖了，那每次都要 imports 就很麻烦。

能不能设置成全局的，它导出的 provider 直接可用呢？

Module、Controller、Provider 是由 Nest 创建的，能不能在创建、销毁的时候执行一些逻辑呢？

这节我们来学习下全局模块和生命周期。

当aaa.module.ts导出AppService服务给其他模块使用的时候，它需要在exports中导出:

```TS
import { Module } from '@nestjs/common';
import { AaaService } from './aaa.service';
import { AaaController } from './aaa.controller';

@Module({
  controllers: [AaaController],
  providers: [AaaService],
  exports: [AaaService],
})
export class AaaModule {}

```

在bbbmodule里面就需要imports来直接导入AaaModule，而不是单独的AaaService:

```JS
import { Module } from '@nestjs/common';
import { BbbService } from './bbb.service';
import { BbbController } from './bbb.controller';
import { AaaModule } from 'src/aaa/aaa.module';

@Module({
  imports: [AaaModule],
  controllers: [BbbController],
  providers: [BbbService],
  exports: [BbbService],
})
export class BbbModule {}

```

然后我们开始应用aaaService，在BbbService里面初始化aaaService并且调用它的内部方法:
```JS
  constructor(private readonly aaaService: AaaService) {}
  create(createBbbDto: CreateBbbDto) {
    return 'This action adds a new bbb';
  }

  findAll() {
    return `This action returns all bbb` + this.aaaService.findAll();
  }
```

但是如果每个模块都需要依赖AaaService这就太麻烦了，这里就需要通过 `@Global`装饰器来进行全局声明:
```JS
import { Module, Global } from '@nestjs/common';
import { AaaService } from './aaa.service';
import { AaaController } from './aaa.controller';
@Global()
@Module({
  controllers: [AaaController],
  providers: [AaaService],
  exports: [AaaService],
})
export class AaaModule {}

```

去除BbbModule中的imports导入AaaModule

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fb83bcc03b6841ce93fd8dff8bb1a39e~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

这是全局模块的用法，但是这东西尽量少用，不然很多注入的provider你都不知道从哪里来的，降低代码的可维护性。

## 生命周期

Nest 在启动的时候，会递归解析 Module 依赖，扫描其中的 provider、controller，注入它的依赖。

全部解析完后，会监听网络端口，开始处理请求。

这个过程中，Nest 暴露了一些生命周期方法：

![img](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cd793a59d8a24b3e86312746c25eeb32~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

首先，递归初始化模块，会依次调用模块内的 controller、provider 的 onModuleInit 方法，然后再调用 module 的 onModuleInit 方法。

全部初始化完之后，再依次调用模块内的 controller、provider 的 onApplicationBootstrap 方法，然后调用 module 的 onApplicationBootstrap 方法

然后监听网络端口。

之后 Nest 应用就正常运行了。

这个过程中，onModuleInit、onApplicationBootstrap 都是我们可以实现的生命周期方法。

ddd.controller.ts:

```javascript
  onModuleInit() {
    console.log('DddModule has been initialized');
  }

  onApplicationBootstrap() {
    console.log('DddApplication has been bootstrapped');
  }
```



ddd.service.ts:

```javascript
  onModuleInit() {
    console.log('DddModule has been initialized');
  }

  onApplicationBootstrap() {
    console.log('DddApplication has been bootstrapped');
  }
```

service和module中的onModuleInit先执行，然后依次执行onApplicationBootstrap。

我们需要在module里面分别定义:
 OnModuleDestroy,

 BeforeApplicationShutdown,

 OnApplicationShutdown

以在生命周期里面调用这些销毁用的生命周期。



beforeApplicationShutdown 是可以拿到 signal 系统信号的，比如 SIGTERM。

这些终止信号是别的进程传过来的，让它做一些销毁的事情，比如用 k8s 管理容器的时候，可以通过这个信号来通知它。

3s后调用app.close()触发实例的销毁，但是这里要注意，app.close()只是触发销毁逻辑，不会真正退出进程:

```TS
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
  setTimeout(() => {
    app.close();
  }, 10000);
}
bootstrap();

```

生命周期的执行顺序如下:

![image-20250316192220336](/Users/heinrichhu/前端项目/NestJS_SD/04_custom-provider/image-20250316192220336.png)

我们来看看 @nestjs/typeorm、@nestjs/mongoose 里都是怎么用的：

![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/53af54ef4fcc4e5c8314979e3e87d3f4~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/67a26e1870004d419fdbdd468caa47ec~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

可以看到，一般都是通过 moduleRef 取出一些 provider 来销毁，比如关闭连接。

这里的 moduleRef 就是当前模块的引用。

我们这里也可以来试一试：

ccc.module.ts:

```javascript
import { ModuleRef } from '@nestjs/core';

@Module({
  providers: [CccService],
})
export class CccModule
  implements
    BeforeApplicationShutdown,

{
  constructor(private readonly moduleRef: ModuleRef) {}
......
......
  onApplicationShutdown(signal: string) {
    const cccService = this.moduleRef.get<CccService>(CccService);
    console.log('--------------------------------', cccService.findAll());
    console.log('CccApplication has been shutdown', signal);
  }
}

```

onApplicationShutdown 的生命周期里，拿到当前模块的引用 moduleRef，调用 get 方法，传入 token，取出对应的 provider 实例，然后调用它的方法。

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2cb550b088b34ad3b0edf770a806f1ac~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)
