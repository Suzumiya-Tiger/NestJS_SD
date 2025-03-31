# 动态模块的应用

一般我们引入模块，都是使用imports:[]这种静态引入的方式，如果我们希望通过动态引入模块并且添加对应的参数，那么我们有什么处理方式呢？

```javascript
import { DynamicModule, Module } from '@nestjs/common';
import { BbbService } from './bbb.service';
import { BbbController } from './bbb.controller';

@Module({})
export class BbbModule {
  static register(options: Record<string, any>): DynamicModule {
    return {
      module: BbbModule,
      controllers: [BbbController],
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        BbbService,
      ],
      exports: [],
    };
  }
}

```

1. 动态模块模式：使用 static register() 方法创建一个可配置的模块
2. 参数传递：接受 options 参数（类型为 Record<string, any>，即任意键值对）
3. 依赖注入设置：

- 注册 BbbController 作为控制器

- 提供两个服务提供者（providers）:

- 自定义提供者 CONFIG_OPTIONS，值为传入的 options

- BbbService 服务

4. 导出：这个模块目前没有导出任何服务（exports 数组为空）



## NestJS 动态模块解析

#### 为什么使用 static register() 方法实现动态模块？

在 NestJS 中，动态模块通过 static register() 方法实现是一种设计模式，我来详细解释这种方式的原理和好处：

#### 1. 静态方法的必要性

使用 static 关键字是因为：

- **无需实例化：静态方法属于类本身而非实例，这意味着您可以直接通过类调用此方法，而不需要先创建类的实例**

- 模块定义时期：在 NestJS 应用启动阶段（模块定义阶段），模块实例尚未创建，此时只能访问静态方法

```typescript
// 可以直接通过类调用 register
BbbModule.register({ apiKey: 'xxx' })

// 如果不是静态方法，就需要先实例化，这在模块系统中不合适
// const bbbModule = new BbbModule();
// bbbModule.register({ apiKey: 'xxx' }) // ❌ 不符合 NestJS 的设计
```

#### 2. 动态模块的工作原理

动态模块解决了一个核心问题：如何在应用启动时为模块传递配置参数。

默认情况下，NestJS 模块是静态的：

```typescript
@Module({
  controllers: [BbbController],
  providers: [BbbService]
})
export class BbbModule {}

// 使用时无法传递配置参数
@Module({
  imports: [BbbModule] // ❌ 无法配置
})
export class AppModule {}
```

通过动态模块我们可以实现参数配置:

```typescript
@Module({
  imports: [
    BbbModule.register({ apiKey: 'your-api-key', timeout: 3000 }) // ✅ 可配置
  ]
})
export class AppModule {}
```

#### 3. register() 方法详解

register() 方法是一个工厂方法，它做了三件重要的事：

1. 接收配置参数：options: Record<string, any>
2. 返回动态模块定义：符合 DynamicModule 接口的对象
3. 注册配置提供者：将配置作为可注入的值

```typescript
static register(options: Record<string, any>): DynamicModule {
  return {
    module: BbbModule,           // 模块类引用
    controllers: [BbbController], // 控制器
    providers: [
      {
        provide: 'CONFIG_OPTIONS', // 注入令牌
        useValue: options,         // 将配置对象注册为可注入值
      },
      BbbService,                  // 服务提供者
    ],
    exports: [],                   // 导出的提供者
  };
}
```



#### 4. 注入配置的实现方式

在您的代码中，配置通过自定义提供者注册，服务可以通过 @Inject() 装饰器注入这些配置：

```typescript
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class BbbService {
  constructor(
    @Inject('CONFIG_OPTIONS') private options: Record<string, any>
  ) {
    // 现在可以访问 options.apiKey, options.timeout 等
    console.log(this.options.apiKey);
  }
}
```

#### 5. 为什么这种方式比其他方式好？

这种动态模块模式相比其他方案有明显优势：

- 封装性好：模块内部细节对使用者隐藏

- 类型安全：可以通过泛型约束配置对象类型

- 可重用性：同一模块可以用不同配置多次导入

- 懒加载支持：与 NestJS 的懒加载模块机制兼容

- 遵循依赖注入原则：配置作为依赖注入，便于测试和解耦

- 启动时配置：在应用启动阶段就完成配置，避免运行时问题

#### 6. 更高级的动态模块模式

在更复杂的场景中，您还可以看到其他类似的静态方法：

```typescript
// 异步加载配置
static forRootAsync(options: AsyncModuleOptions): DynamicModule {...}

// 功能模块配置
static forFeature(entities: any[]): DynamicModule {...}
```

这些都是同一模式的变体，用于不同的配置场景。

总的来说，NestJS 的动态模块模式通过静态方法返回模块定义，实现了模块的可配置性，同时保持了强大的依赖注入和模块化特性。这是一种优雅且强大的设计模式，广泛应用于 NestJS 生态系统中。





## 自动生成动态模块

在ccc模块目录下自建一个文件:ccc.module-definition.ts:

```typescript
import { ConfigurableModuleBuilder } from "@nestjs/common";

export interface CccModuleOptions {
  apiKey?: string;
  endpoint: string;
  timeout?: number;
  debug?: boolean;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<CccModuleOptions>().build();

```

我们可以通过这个文件自动生成register动态模块，并且可以把option的组织和参数提前定义好，作为调用该register注入参数时候的唯一指定的约束类型。

**用 ConfigurableModuleBuilder 生成一个 class，这个 class 里就带了 register、registerAsync 方法。**

返回的 ConfigurableModuleClass、MODULE_OPTIONS_TOKEN 分别是生成的 class 、options 对象的 token。

<CccModuleOptions> 在这里有以下含义：

1. 类型约束：它告诉 TypeScript 和 NestJS，这个模块接受的配置必须符合 CccModuleOptions 接口定义的结构
2. 代码提示：当开发者使用这个模块时，IDE 会提供基于 CccModuleOptions 的代码补全和类型检查
3. 模块配置契约：它定义了使用此模块必须提供哪些配置选项

### 与 ConfigurableModuleBuilder 的关系

ConfigurableModuleBuilder 是 NestJS 提供的一个工具，用于简化创建可配置模块的过程。通过泛型参数，它可以：

1. 自动生成适当的方法 (register, forRoot, forFeature 等)
2. 处理同步和异步配置
3. 创建适当的提供者和注入令牌

这种方式比手动编写所有动态模块逻辑要简单得多，并且提供了类型安全。总之，<CccModuleOptions> 是一个类型定义，用于指定这个可配置模块接受什么样的配置选项，确保类型安全和良好的开发体验。

###  应用ConfigurableModuleClass



我们这里无需定义复杂的register，而是直接在Ccc.module.ts中直接extends该class，即可自动注入register方法:
```typescript
import { Module } from '@nestjs/common';
import { CccController } from './ccc.controller';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './ccc.module-definition';
@Module({
  controllers: [CccController],
})
export class CccModule extends ConfigurableModuleClass {}

```

最后我们来在app.module.ts中注入对应的参数:

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BbbModule } from './bbb/bbb.module';
import { CccModule } from './ccc/ccc.module';

@Module({
  imports: [
    BbbModule.register({
      a: 1,
      b: 2,
    }),
    CccModule.register({
      apiKey: '1234567890',
      endpoint: 'https://api.example.com',
      timeout: 5000,
      debug: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

```

### 注入CccModuleOptions

我们再通过CccModule.register完成CccModuleOptions的实例创建后，接下来我们需要注入option到需要的地方予以应用，这个时候前面的MODULE_OPTIONS_TOKEN就会开始生效了。



MODULE_OPTIONS_TOKEN就是用来给我们引用已经生成的实例中的配置参数用的，当然使用依然需要通过依赖注入装饰器@Inject来实现CccModuleOptions参数的注入使用:

@Inject(MODULE_OPTIONS_TOKEN)在app.module.ts中的流程如下:


1. NestJS 依赖注入系统检测到 @Inject(MODULE_OPTIONS_TOKEN) 装饰器
2. 系统查找与 MODULE_OPTIONS_TOKEN 关联的提供者
3. 找到的值被注入到 options 属性中
4. 现在控制器可以访问 this.options 中的配置数据

ccc.controller.ts:
```typescript
import { Controller, Get, Inject } from '@nestjs/common';
import {
  CccModuleOptions,
  MODULE_OPTIONS_TOKEN,
} from './ccc.module-definition';

@Controller('ccc')
export class CccController {
  @Inject(MODULE_OPTIONS_TOKEN)
  private readonly options: CccModuleOptions;

  @Get()
  getHello(): CccModuleOptions {
    return this.options;
  }
}

```

## register的异步用法

我们可以使用registerAsync 方法，用 useFactory 动态创建 options 对象:
```typescript
    CccModule.registerAsync({
      useFactory: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          apiKey: '1234567890',
          endpoint: 'https://api.example.com',
          timeout: 5000,
          debug: true,
        };
      },
    }),
```

当然，如果我们想生成forRoot或者forFeature，那么我们在应用ConfigurableModuleBuilder的时候，就需要考虑使用setClassMethodName定义传参来决定具体的register类型:
```typescript
import { ConfigurableModuleBuilder } from '@nestjs/common';

......
......

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<CccModuleOptions>()
    .setClassMethodName('forRoot')
    .build();

```

然后在Aaa.module.ts中进行注入操作:
```typescript
  imports: [
    BbbModule.register({
      a: 1,
      b: 2,
    }),

    CccModule.forRoot({
      apiKey: '1234567890',
      endpoint: 'https://api.example.com',
      timeout: 5000,
      debug: true,
    }),

  ],
```

如果你期望根据传入的参数是否设定为全局模块，那你可以考虑给option设置setExtra属性:

1. 首先需要设置isGlobal为true
2. 其次需要在第二个函数定义关键传参extra，然后在函数体的内部通过global属性再次定义extras.isGlobal

```typescript
import { ConfigurableModuleBuilder } from "@nestjs/common";

export interface CccModuleOptions {
    aaa: number;
    bbb: string;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<CccModuleOptions>().setClassMethodName('register').setExtras({
    isGlobal: true
  }, (definition, extras) => ({
    ...definition,
    global: extras.isGlobal,
  })).build();


```

这时候你就会发现 register 的 options 多了 isGlobal：

![img](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4bf3b9deaeb54f93a188e3047a12af17~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

这样创建的就是全局的模块。





# 总结

1. 所谓动态Module就是在定义module的时候，允许通过 `static register`的形式来进行动态传入参数的提前声明，并且定义好对应的ts接口类型的声明。
2. 在动态定义Module的自动生成的方法中，单独定义一个module定义方法来利用ConfigurableModuleBuilder创建register自动生成器。返回的两个返回值：`ConfigurableModuleClass, MODULE_OPTIONS_TOKEN `，一个是拿来给你在对应的模块下通过extends注入register方法，一个是拿来给你获取对应的register的值用的。
3. setClassMethodName可以指定是register或者forRoot、forFeature。
4. 在具体的控制器下通过`@Inject(MODULE_OPTIONS_TOKEN)`配合声明useValue的值来实现具体值的依赖注入和应用。
5. Module 可以传入 options 动态产生，这叫做动态 Module，你还可以把传入的 options 作为 provider 注入到别的对象里
6. 建议的动态产生 Module 的方法名有 register、forRoot、forFeature 3种。
   - register：用一次注册一次
   - forRoot：只注册一次，用多次，一般在 AppModule 引入
   - forFeature：用了 forRoot 之后，用 forFeature 传入局部配置，一般在具体模块里 imports

7. 并且这些方法都可以写 xxxAsync 版本，也就是传入 useFactory 等 option，内部注册异步 provider。
8. 这个过程也可以用 ConfigurableModuleBuilder 来生成。通过 setClassMethodName 设置方法名，通过 setExtras 设置额外的 options 处理逻辑。
9. 并且返回的 class 都有 xxxAsync 的版本。
10. 这就是动态模块的定义方式，后面用到 typeorm、mongoose 等模块会大量见到这种模块。
