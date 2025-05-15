# 日志记录

main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { MyLogger } from './MyLogger';
import { MyLogger3 } from './MyLogger3';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // 自定义
    // logger: new MyLogger(),
    /* bufferLogs 就是先不打印日志，把它放到 buffer 缓冲区，直到用 useLogger 指定了 Logger 并且应用初始化完毕。 */
    bufferLogs: true,
  });
  app.useLogger(app.get(MyLogger3));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

```

bufferLogs 是 NestJS 的一个日志缓冲机制。当设置为 true 时，应用启动过程中产生的日志不会立即打印，而是先存储在缓冲区中，直到应用完全初始化并通过 useLogger 指定了自定义的日志记录器后才会一起输出。

这在使用自定义日志记录器时特别有用，因为它可以确保应用启动阶段的所有日志都能被你的自定义记录器处理，而不是部分日志使用默认记录器输出。

MyLogger3.ts

```typescript
import { Inject } from '@nestjs/common';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { AppService } from './app.service';

@Injectable()
export class MyLogger3 extends ConsoleLogger {
  @Inject(AppService)
  private appService: AppService;

  log(message, context) {
    console.log(this.appService.getHello());
    console.log(`[${context}]`, message);
    console.log('--------------');
  }
}

```

打印输出:

![image-20250514172618294](D:\HeinrichHu\resource\NestJS_SD\20_logger-test\README.assets\image-20250514172618294.png)

我们可以通过` app.useLogger(app.get(MyLogger3));`指定我们的日志输出器，然后在MyLogger3里面注入AppService依赖，实现了在日志记录的控制器中注入我们想要的依赖，并且打印对应的输出。



# 动态日志模块

`nest g module logger2`生成日志模块。

```typescript
// 从 @nestjs/common 导入必要的装饰器和类型
import { DynamicModule, Global, Module } from '@nestjs/common';
// 导入自定义的 MyLogger 服务
import { MyLogger } from './MyLogger';

// @Global() 装饰器使这个模块成为全局模块。
// 一旦在根模块导入，其导出的提供者在整个应用中都可用，无需在每个模块中单独导入。
@Global()
// @Module() 装饰器将 LoggerModule2 标记为一个 NestJS 模块。
// 空的 {} 表示模块本身在静态层面没有预定义的提供者、控制器等，
// 它的配置和提供者将通过 register 方法动态定义。
@Module({})
export class LoggerModule2 {
  /**
   * 静态方法，用于创建和配置一个动态模块实例。
   * 这种模式允许模块在被导入时接收参数（options）并据此进行配置。
   * @param options - 一个对象，包含用于配置日志模块的选项。
   * 类型 Record<string, any> 表示它是一个键为字符串、值为任意类型的对象。
   * @returns DynamicModule - 一个符合 DynamicModule 接口的对象，定义了模块的属性。
   */
  static register(options: Record<string, any>): DynamicModule {
    return {
      // module: 指定当前动态模块是 LoggerModule2 的一个实例。
      module: LoggerModule2,
      // providers: 定义此模块提供的服务或值。
      providers: [
        // 注册 MyLogger 服务，使其可以通过依赖注入在应用中使用。
        MyLogger,
        // 注册一个自定义提供者，用于提供日志选项。
        {
          // provide: 'LOG_OPTIONS' - 定义注入令牌。
          // 其他服务可以通过 @Inject('LOG_OPTIONS') 来注入这个值。
          provide: 'LOG_OPTIONS',
          // useValue: options - 指定该提供者的实际值，即传入 register 方法的 options 对象。
          useValue: options,
        },
      ],
      // exports: 定义此模块中哪些提供者可以被其他导入此模块的模块使用。
      exports: [MyLogger, 'LOG_OPTIONS'],
    };
  }
}

```

## MyLogger

我们先分别看一下 LoggerModule2 中的 providers 和 MyLogger 中的 @Inject 是如何工作的：

1. LoggerModule2 中的 providers 数组:

```typescript
// src/logger2/logger2.module.ts
// ...
      providers: [
        // 1. 注册 MyLogger 服务
        MyLogger,
        // 2. 注册一个名为 'LOG_OPTIONS' 的提供者，其值为传入的 options 对象
        {
          provide: 'LOG_OPTIONS',
          useValue: options,
        },
      ],
// ...
```

- MyLogger: 当你在这里列出 MyLogger 时，你**是在告诉 NestJS 的依赖注入 (DI) 系统：“MyLogger 这个类是一个提供者 (provider)。如果其他地方需要 MyLogger 的实例，请创建并提供它。” 这使得 MyLogger 服务本身可以被注入到其他控制器、服务等地方。**

- `{ provide: 'LOG_OPTIONS', useValue: options }`: 这一部分注册了另一个提供者。

- `provide: 'LOG_OPTIONS': 'LOG_OPTIONS'` 是一个注入令牌 (injection token)。它是一个唯一的标识符。

- `useValue: options`: 这指定了与 'LOG_OPTIONS' 令牌关联的值就是传递给 `LoggerModule2.register(options)` 方法的 options 对象。

现在，应用中任何地方想要获取这个 options 对象，都可以通过请求注入 'LOG_OPTIONS' 这个令牌来实现。

2. MyLogger.ts 中的 @Inject('LOG_OPTIONS'):

```typescript
// src/logger2/MyLogger.ts
import { ConsoleLogger, Inject } from '@nestjs/common';

export class MyLogger extends ConsoleLogger {
  @Inject('LOG_OPTIONS') // 3. 请求注入 'LOG_OPTIONS'
  declare public options: Record<string, any>;

  log(message: string, context: string) {
    console.log('options', this.options); // 4. 使用注入的 options
    // ...
  }
}
```

- @Inject('LOG_OPTIONS'): 这个装饰器用在 MyLogger 类的 options 属性上。它告诉 NestJS DI 系统：“当我（MyLogger类）被实例化的时候，请查找由令牌 'LOG_OPTIONS' 注册的提供者，并将它的值注入到我的 options 属性中。”

### 依赖关系分离

为什么需要这样做？—— 依赖关系的分离

这里的核心思想是依赖注入和关注点分离：

- LoggerModule2 的职责：

1. 让 MyLogger 服务本身可用（通过在 providers 中列出 MyLogger）。
2. 接收外部配置 (options)，并使这个配置以一种标准化的方式（通过 'LOG_OPTIONS' 令牌）在应用中可用。

- MyLogger 的职责：

1. 执行日志记录的逻辑。
2. 它可能需要一些配置信息（比如日志级别、前缀等）来定制其行为。它通过声明对 'LOG_OPTIONS' 的依赖来获取这些配置。

所以，即使 MyLogger 已经在 LoggerModule2 中被注册为一个提供者，这只是意味着 MyLogger 的实例可以被创建和注入到其他地方。

但是，MyLogger 实例本身为了能够正确工作，它还需要一些配置数据。 它通过 @Inject('LOG_OPTIONS') 来声明这个需求，并从 DI 容器中获取由 LoggerModule2 提供的 options 值。

可以这样理解：

1. LoggerModule2 说：“嘿，我这里有一个 MyLogger 服务，大家可以用。我还提供了一份配置，叫做 'LOG_OPTIONS'。”

1. 当 NestJS 创建 MyLogger 的实例时，MyLogger 内部的 @Inject('LOG_OPTIONS') 会说：“我需要那份叫做 'LOG_OPTIONS' 的配置才能工作。”

1. NestJS DI 系统就会把 LoggerModule2 提供的 options 对象传递给 MyLogger 实例的 options 属性。

这种方式使得 MyLogger 的实现与其配置的来源解耦。MyLogger 不关心 options 是如何产生的，它只关心能够通过 'LOG_OPTIONS' 令牌获取到它需要的配置。而 LoggerModule2 则负责管理和提供这些配置。

你看到的 declare public options: Record<string, any>; 是因为 ConsoleLogger 基类可能已经有 options 属性，使用 declare 关键字配合 @Inject 可以告诉 TypeScript 这个属性会在运行时被 DI 系统初始化，从而避免与基类属性冲突或覆盖的编译警告，同时允许 DI 系统正确注入值。



## 应用Logger

app.service.ts
```ts
// 1. 从 @nestjs/common 导入 Inject 和 Injectable 装饰器
import { Inject, Injectable } from '@nestjs/common';
// 2. 从 './logger2/MyLogger' 导入 MyLogger 类
import { MyLogger } from './logger2/MyLogger';

// 3. @Injectable() 装饰器将 AppService 标记为一个可注入的服务
@Injectable()
export class AppService {
  // 4. @Inject(MyLogger) 装饰器用于注入 MyLogger 的实例
  //    NestJS DI 系统会自动查找 MyLogger 的提供者并创建一个实例赋值给 logger 属性
  @Inject(MyLogger)
  private logger: MyLogger; // 5. 声明一个私有的 logger 属性，类型为 MyLogger

  // 6. 定义一个名为 getHello 的公共方法
  getHello(): string {
    // 7. 使用注入的 logger 实例来记录日志
    //    'yyy' 是日志消息
    //    AppService.name (即字符串 "AppService") 是日志上下文 (context)
    this.logger.log('yyy', AppService.name);

    // 8. 方法返回字符串 'Hello World!'
    return 'Hello World!';
  }
}

```

详细讲解:

1. 导入 Inject 和 Injectable:

- Injectable: 这是一个装饰器，标记 AppService 类为一个可以被 NestJS 依赖注入 (DI) 系统管理的提供者 (provider)。这意味着 NestJS 可以创建 AppService 的实例，并将其注入到其他需要它的地方（比如控制器）。

- Inject: 这是一个装饰器，用于显式指定要注入的依赖项的令牌。在这种情况下，它与类名 MyLogger一起使用，MyLogger 类本身就充当了注入令牌。

1. 导入 MyLogger:

- import { MyLogger } from './logger2/MyLogger';

- 这行代码导入了你在 logger2 文件夹中定义的 MyLogger 类。这是必需的，因为：

- TypeScript 需要知道 MyLogger 的类型定义，以便进行类型检查（例如，确保 this.logger 具有 log 方法）。

- @Inject(MyLogger) 使用 MyLogger 类作为注入的令牌。

1. @Injectable():

- 将 AppService 声明为一个服务。

1. @Inject(MyLogger):

- 这是依赖注入的核心部分。当 NestJS 创建 AppService 的实例时，它会看到这个装饰器。

- 它告诉 NestJS：“我需要一个 MyLogger 类型的实例。”

- NestJS 的 DI 系统会去查找之前注册过的 MyLogger 提供者（回顾一下，MyLogger 是在 LoggerModule2 的 providers 数组中注册的，并且 LoggerModule2 是 @Global的）。

- 一旦找到，DI 系统会创建（或重用，取决于作用域）一个 MyLogger 的实例，并将其赋值给 this.logger 属性。

- 关键点：当 MyLogger 的实例被创建时，它内部的 @Inject('LOG_OPTIONS') 也会被处理，所以注入到 AppService 中的 logger 实例已经拥有了通过 LoggerModule2.register(options) 传递的配置。

1. private logger: MyLogger;:

- 声明了一个私有属性 logger，并指定其类型为 MyLogger。这使得在 AppService 类内部可以通过 this.logger 来访问 MyLogger 实例的方法和属性。

1. getHello(): string:

- 这是 AppService 提供的一个简单方法。

1. this.logger.log('yyy', AppService.name);:

- 这里就是 MyLogger 的实际应用。

- this.logger 指向的是由 NestJS DI 系统注入的 MyLogger 实例。

- 调用 this.logger.log(...) 会执行 MyLogger 类中定义的 log 方法。



### 为options赋值

app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MyLogger3 } from './MyLogger3';
import { LoggerModule } from './logger/logger.module';
import { AaaModule } from './aaa/aaa.module';
import { LoggerModule2 } from './logger2/logger2.module';
@Module({
  imports: [
    LoggerModule,
    AaaModule,
    LoggerModule2.register({ xxx: 1, yyy: 2 }),
  ],
  controllers: [AppController],
  providers: [AppService, MyLogger3],
})
export class AppModule {}

```



### 总结 AppService 和 MyLogger 的交互

- AppService 依赖于 MyLogger 来执行日志记录任务。

- 它通过 NestJS 的依赖注入机制获取 MyLogger 的一个完全配置好的实例。

- "完全配置好" 指的是 MyLogger 实例不仅被创建了，而且它内部所依赖的 'LOG_OPTIONS' 也已经被成功注入。

- 这样，AppService 不需要知道如何创建或配置 MyLogger，**它只需要声明对 MyLogger 的需求，DI 系统就会处理剩下的事情。这体现了控制反转 (IoC) 和依赖注入 (DI) 的设计原则，使得代码更加模块化、可测试和易于维护。**

当你运行应用并调用一个会触发 AppService 的 getHello 方法的端点时，你会在控制台中看到由 MyLogger 输出的日志信息，包括它所接收到的配置选项。
