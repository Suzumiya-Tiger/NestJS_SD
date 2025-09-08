# NestJS Winston Logger 代码详解

## 1. 代码整体架构分析

这段代码的目的是**创建一个自定义的 NestJS Logger，用 Winston 作为底层日志引擎**。

```javascript
// 实现了 NestJS 的 LoggerService 接口
export class MyLogger implements LoggerService {
  // 使用 Winston 作为内部日志处理器
  private logger: Logger;
}
```

## 2. 令人困惑的地方分析

### 困惑点 1: Winston 格式配置的复杂性

```javascript
// 在 transports 中定义格式，而不是在根级别
new transports.Console({
  format: format.combine(
    format.colorize(),
    format.simple(),
    format.printf(({ context, level, message, time }) => {
      // 自定义格式化逻辑
    }),
  ),
})
```

**为什么这样配置？**

- Winston 允许在**全局**和**传输层**分别设置格式
- 这里选择在传输层设置，可以为不同的输出目标设置不同格式
- `format.printf` 是最终的格式化函数，可以完全自定义输出格式

### 困惑点 2: 参数传递的不一致性

```javascript
// 调用方式
this.logger.log('info', message, { context, time });

// printf 函数接收到的参数
format.printf(({ context, level, message, time }) => {
  // context 和 time 来自第三个参数对象
  // level 来自第一个参数 'info'
  // message 来自第二个参数
})
```

**Winston 的参数传递机制：**

1. 第一个参数：日志级别 (`'info'`, `'error'` 等)
2. 第二个参数：主要消息内容
3. 第三个参数：元数据对象，会被合并到日志对象中

## 3. 详细的工作流程

### 步骤 1: 初始化 Winston Logger

```javascript
constructor() {
  this.logger = createLogger({
    level: 'debug',  // 设置最低日志级别
    transports: [
      new transports.Console({
        // 控制台输出的格式配置
      })
    ]
  });
}
```

### 步骤 2: 实现 NestJS LoggerService 接口

```javascript
// NestJS 要求实现这些方法
log(message: string, context: string)     // 普通日志
error(message: string, context: string)   // 错误日志  
warn(message: string, context: string)    // 警告日志
debug(message: string, context: string)   // 调试日志
```

### 步骤 3: 日志格式化处理

```javascript
format.printf(({ context, level, message, time }) => {
  const appStr = chalk.green(`[NEST]`);      // 绿色的 [NEST] 标识
  const contextStr = chalk.yellow(`[${context}]`); // 黄色的上下文
  return `${appStr} ${contextStr} ${level} ${time} ${message}`;
});
```

## 4. 实际执行示例

假设调用：

```javascript
const logger = new MyLogger();
logger.log('服务启动成功', 'AppController');
```

**执行流程：**

1. **调用 log 方法**

```javascript
log(message: '服务启动成功', context: 'AppController') {
  const time = '2024-01-15 14:30:00';  // dayjs 格式化当前时间
  this.logger.log('info', '服务启动成功', { 
    context: 'AppController', 
    time: '2024-01-15 14:30:00' 
  });
}
```

1. **Winston 处理**

```javascript
// Winston 内部处理后传给 printf 的对象：
{
  level: 'info',
  message: '服务启动成功',
  context: 'AppController',
  time: '2024-01-15 14:30:00'
}
```

1. **最终输出**

```
[NEST] [AppController] info 2024-01-15 14:30:00 服务启动成功
```

## 5. 代码中的问题和改进建议

### 问题 1: 重复的时间格式化

每个方法都在重复格式化时间：

```javascript
const time = dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss');
```

**改进建议：**

```javascript
export class MyLogger implements LoggerService {
  constructor() {
    this.logger = createLogger({
      level: 'debug',
      transports: [
        new transports.Console({
          format: format.combine(
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Winston 自动添加时间戳
            format.colorize(),
            format.printf(({ context, level, message, timestamp }) => {
              const appStr = chalk.green(`[NEST]`);
              const contextStr = chalk.yellow(`[${context}]`);
              return `${appStr} ${contextStr} ${level} ${timestamp} ${message}`;
            }),
          ),
        }),
      ],
    });
  }

  log(message: string, context: string) {
    // 不需要手动处理时间
    this.logger.log('info', message, { context });
  }
}
```

### 问题 2: 硬编码的日志级别

每个方法都使用字符串字面量：

```javascript
this.logger.log('info', message, { context, time });
```

**改进建议：**

```javascript
log(message: string, context: string) {
  this.logger.info(message, { context }); // 直接使用 Winston 的方法
}

error(message: string, context: string) {
  this.logger.error(message, { context });
}
```

## 6. 更清晰的重构版本

```javascript
import { LoggerService } from '@nestjs/common';
import * as chalk from 'chalk';
import { createLogger, format, Logger, transports } from 'winston';

export class MyLogger implements LoggerService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger({
      level: 'debug',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true })
      ),
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(this.customFormat.bind(this))
          ),
        }),
      ],
    });
  }

  private customFormat({ level, message, timestamp, context, stack }) {
    const appStr = chalk.green(`[NEST]`);
    const contextStr = context ? chalk.yellow(`[${context}]`) : '';
    const stackStr = stack ? `\n${stack}` : '';
    
    return `${appStr} ${contextStr} ${level} ${timestamp} ${message}${stackStr}`;
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, context?: string, trace?: string) {
    this.logger.error(message, { context, stack: trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

## 总结

**原代码的主要困惑点：**

1. Winston 格式配置的层级关系
2. 参数在 Winston 内部的传递和合并机制
3. 手动时间处理 vs Winston 内置时间戳
4. NestJS LoggerService 接口与 Winston API 的适配

**核心理解：**

- 这个类是 NestJS 和 Winston 之间的适配器
- Winston 的 `format.printf` 可以访问所有传入的参数和元数据
- 通过实现 `LoggerService` 接口，可以替换 NestJS 的默认日志器





# Winston 日志轮换实现方案

## 1. 最推荐：使用 winston-daily-rotate-file

这是最常用和最成熟的解决方案：

### 安装依赖

bash

```bash
npm install winston-daily-rotate-file
```

### 基本实现

javascript

```javascript
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

export class MyLogger implements LoggerService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger({
      level: 'debug',
      transports: [
        // 控制台输出
        new transports.Console({
          format: format.combine(
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            format.colorize(),
            format.printf(({ context, level, message, timestamp }) => {
              const appStr = chalk.green(`[NEST]`);
              const contextStr = chalk.yellow(`[${context}]`);
              return `${appStr} ${contextStr} ${level} ${timestamp} ${message}`;
            }),
          ),
        }),
        
        // 按日期轮换的文件输出
        new transports.DailyRotateFile({
          filename: 'application-%DATE%.log',
          dirname: 'logs',
          datePattern: 'YYYY-MM-DD',        // 每天轮换
          zippedArchive: true,              // 压缩旧文件
          maxSize: '20m',                   // 单文件最大 20MB
          maxFiles: '14d',                  // 保留 14 天的日志
          format: format.combine(
            format.timestamp(),
            format.json()
          )
        }),
        
        // 错误日志单独存储
        new transports.DailyRotateFile({
          level: 'error',
          filename: 'error-%DATE%.log',
          dirname: 'logs',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',                  // 错误日志保留更久
          format: format.combine(
            format.timestamp(),
            format.json()
          )
        })
      ],
    });
  }
}
```

## 2. 不同的轮换策略

### 按时间轮换

javascript

```javascript
// 每小时轮换
new transports.DailyRotateFile({
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  dirname: 'logs'
});

// 每天轮换（默认）
new transports.DailyRotateFile({
  filename: 'app-%DATE%.log', 
  datePattern: 'YYYY-MM-DD',
  dirname: 'logs'
});

// 每周轮换
new transports.DailyRotateFile({
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-ww',      // ww 表示周数
  dirname: 'logs'
});

// 每月轮换
new transports.DailyRotateFile({
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM',
  dirname: 'logs'
});
```

### 按文件大小轮换

javascript

```javascript
new transports.DailyRotateFile({
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '10m',              // 超过 10MB 就轮换
  maxFiles: '5',               // 最多保留 5 个文件
  dirname: 'logs'
});
```

## 3. 生产环境的完整配置

javascript

```javascript
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

export class ProductionLogger implements LoggerService {
  private logger: Logger;

  constructor() {
    // 创建不同级别的轮换文件配置
    const fileRotateTransport = new transports.DailyRotateFile({
      filename: 'combined-%DATE%.log',
      dirname: 'logs',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      )
    });

    const errorFileRotateTransport = new transports.DailyRotateFile({
      level: 'error',
      filename: 'error-%DATE%.log',
      dirname: 'logs',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '30d',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      )
    });

    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      transports: [
        // 开发环境才输出到控制台
        ...(process.env.NODE_ENV !== 'production' ? [
          new transports.Console({
            format: format.combine(
              format.colorize(),
              format.simple()
            )
          })
        ] : []),
        
        // 所有环境都输出到文件
        fileRotateTransport,
        errorFileRotateTransport
      ],
    });

    // 监听轮换事件
    fileRotateTransport.on('rotate', (oldFilename, newFilename) => {
      console.log(`日志文件轮换: ${oldFilename} -> ${newFilename}`);
    });

    fileRotateTransport.on('archive', (zipFilename) => {
      console.log(`日志文件已压缩: ${zipFilename}`);
    });
  }
}
```

## 4. 按业务模块分离日志

javascript

```javascript
export class ModularLogger implements LoggerService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger({
      transports: [
        // API 访问日志
        new transports.DailyRotateFile({
          level: 'http',
          filename: 'api-%DATE%.log',
          dirname: 'logs/api',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '7d'
        }),
        
        // 数据库操作日志
        new transports.DailyRotateFile({
          filename: 'database-%DATE%.log',
          dirname: 'logs/database',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
          format: format.combine(
            format.timestamp(),
            format.json(),
            // 只记录包含 database 上下文的日志
            format((info) => {
              return info.context === 'Database' ? info : false;
            })()
          )
        }),
        
        // 业务逻辑日志
        new transports.DailyRotateFile({
          filename: 'business-%DATE%.log', 
          dirname: 'logs/business',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '14d'
        })
      ]
    });
  }
}
```

## 5. 高级配置：性能优化

javascript

```javascript
new transports.DailyRotateFile({
  filename: 'app-%DATE%.log',
  dirname: 'logs',
  datePattern: 'YYYY-MM-DD',
  
  // 性能优化配置
  maxSize: '100m',             // 较大的文件大小减少轮换频率
  maxFiles: '30d',
  zippedArchive: true,         // 压缩节省空间
  
  // 自定义轮换逻辑
  createSymlink: true,         // 创建指向当前日志的软链接
  symlinkName: 'current.log',  // 软链接名称
  
  // 异步写入优化
  handleExceptions: false,     // 不处理异常（避免阻塞）
  handleRejections: false,     // 不处理 Promise 拒绝
  
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  )
});
```

## 6. 监控和告警集成

javascript

```javascript
export class MonitoredLogger implements LoggerService {
  private logger: Logger;

  constructor() {
    const errorTransport = new transports.DailyRotateFile({
      level: 'error',
      filename: 'error-%DATE%.log',
      dirname: 'logs',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d'
    });

    // 监听错误日志，发送告警
    errorTransport.on('logged', (info) => {
      if (info.level === 'error') {
        this.sendAlert(info);
      }
    });

    this.logger = createLogger({
      transports: [errorTransport]
    });
  }

  private async sendAlert(errorInfo: any) {
    // 发送邮件、短信、钉钉等告警
    // await this.emailService.sendAlert(errorInfo);
    // await this.dingTalkService.sendAlert(errorInfo);
  }
}
```

## 7. 实际的文件结构

使用轮换后，你的日志目录会变成这样：

```
logs/
├── application-2024-01-15.log.gz    (压缩的历史文件)
├── application-2024-01-16.log.gz
├── application-2024-01-17.log       (当前文件)
├── error-2024-01-15.log.gz
├── error-2024-01-16.log.gz
├── error-2024-01-17.log
└── current.log -> application-2024-01-17.log  (软链接)
```

## 总结

**推荐做法：**

1. **使用 winston-daily-rotate-file**：最成熟的解决方案
2. **按日期轮换**：`datePattern: 'YYYY-MM-DD'`
3. **设置文件大小限制**：`maxSize: '20m'`
4. **压缩历史文件**：`zippedArchive: true`
5. **限制保留时间**：`maxFiles: '14d'`
6. **错误日志单独存储**：便于排查问题
7. **监听轮换事件**：便于监控和告警

这样就能实现自动的日志文件管理，不需要手动干预！



# NestJS 动态模块生成和应用流程详解

## 1. 完整的执行流程概览

```
main.ts 启动
    ↓
NestFactory.create(AppModule) 
    ↓
解析 AppModule 的 imports
    ↓  
调用 WinstonModule.forRoot(options)
    ↓
返回动态模块配置
    ↓
创建 Provider 实例
    ↓
注册到 DI 容器
    ↓
app.get(TOKEN) 获取实例
    ↓
app.useLogger() 设置全局日志器
```

## 2. 第一步：NestFactory.create(AppModule)

```javascript
// main.ts
const app = await NestFactory.create(AppModule);
```

**这一步 NestJS 内部做了什么：**

### 2.1 解析 AppModule

```javascript
// NestJS 内部逻辑（简化版）
class NestApplicationContext {
  async create(module: Type<any>) {
    // 1. 读取 AppModule 的元数据
    const moduleMetadata = Reflect.getMetadata('imports', AppModule);
    
    // 2. 解析 imports 数组
    for (const importedModule of moduleMetadata.imports) {
      await this.processModule(importedModule);
    }
  }
}
```

### 2.2 发现 WinstonModule.forRoot()

```javascript
// AppModule 中的 imports
imports: [
  WinstonModule.forRoot({  // ← NestJS 看到这是一个函数调用
    level: 'debug',
    transports: [...],
  }),
]
```

**关键点：** NestJS 发现 `WinstonModule.forRoot()` 不是普通的类，而是一个**函数调用**，知道这是动态模块。

## 3. 第二步：执行 WinstonModule.forRoot()

```javascript
// winston.module.ts
export class WinstonModule {
  public static forRoot(options: LoggerOptions): DynamicModule {
    return {
      module: WinstonModule,
      providers: [
        { 
          provide: WINSTON_LOGGER_TOKEN, 
          useValue: new MyLogger(options)  // ← 这里创建了 MyLogger 实例
        },
      ],
      exports: [WINSTON_LOGGER_TOKEN],
    };
  }
}
```

**执行过程：**

### 3.1 接收配置参数

```javascript
// 传入的 options 对象
const options = {
  level: 'debug',
  transports: [
    new transports.Console({...}),
    new transports.DailyRotateFile({...})
  ]
};
```

### 3.2 创建 MyLogger 实例

```javascript
// 相当于执行了：
const myLoggerInstance = new MyLogger(options);

// MyLogger 构造函数内部：
constructor(options) {
  this.logger = createLogger(options);  // 创建 Winston Logger
}
```

### 3.3 返回动态模块配置

```javascript
// forRoot 返回的对象
{
  module: WinstonModule,
  providers: [
    { 
      provide: 'WINSTON_LOGGER',        // Token 作为标识符
      useValue: myLoggerInstance        // 已创建的实例
    },
  ],
  exports: ['WINSTON_LOGGER'],          // 导出供其他模块使用
}
```

## 4. 第三步：NestJS 处理动态模块配置

```javascript
// NestJS 内部处理逻辑（简化版）
class ModuleCompiler {
  async compileModule(dynamicModuleConfig) {
    const { module, providers, exports } = dynamicModuleConfig;
    
    // 1. 注册 providers 到 DI 容器
    for (const provider of providers) {
      this.container.addProvider(provider.provide, provider.useValue);
    }
    
    // 2. 标记可导出的服务
    for (const exportToken of exports) {
      this.container.addExport(exportToken);
    }
  }
}
```

**此时 DI 容器的状态：**

```javascript
// DI 容器内部类似这样：
const container = new Map([
  ['WINSTON_LOGGER', myLoggerInstance],  // Token -> 实例的映射
  // ... 其他服务
]);
```

## 5. 第四步：在 Controller 中注入使用

```javascript
// app.controller.ts
@Controller()
export class AppController {
  @Inject(WINSTON_LOGGER_TOKEN)  // ← 通过 Token 注入
  private logger: MyLogger;
}
```

**注入过程：**

```javascript
// NestJS 依赖注入系统内部逻辑
class DIContainer {
  injectDependencies(target: any) {
    const metadata = Reflect.getMetadata('inject', target);
    
    for (const injection of metadata) {
      const token = injection.token;           // 'WINSTON_LOGGER'
      const instance = this.get(token);       // 从容器获取实例
      target[injection.property] = instance;  // 赋值给属性
    }
  }
}
```

## 6. 第五步：main.ts 中设置全局日志器

```javascript
// main.ts
const app = await NestFactory.create(AppModule);
app.useLogger(app.get(WINSTON_LOGGER_TOKEN));
```

### 6.1 app.get() 的工作原理

```javascript
// app.get() 内部实现
class NestApplication {
  get<T>(token: string): T {
    // 从 DI 容器中根据 token 获取实例
    return this.container.get(token);
  }
}

// 相当于：
const loggerInstance = container.get('WINSTON_LOGGER');  // 返回之前创建的 MyLogger 实例
```

### 6.2 app.useLogger() 的作用

```javascript
// NestJS 内部实现
class NestApplication {
  useLogger(logger: LoggerService) {
    // 将自定义的 logger 设置为全局日志器
    // 替换 NestJS 默认的 Logger
    this.globalLogger = logger;
    
    // 所有内部日志都会使用这个 logger
    this.moduleInitializer.setLogger(logger);
    this.routeResolver.setLogger(logger);
  }
}
```

## 7. 完整的数据流向图

```
配置对象 (options)
    ↓
WinstonModule.forRoot(options)
    ↓
new MyLogger(options)
    ↓
createLogger(options) [Winston]
    ↓
返回 DynamicModule 配置
    ↓
NestJS 注册到 DI 容器
    ↓
app.get(TOKEN) 获取实例
    ↓
app.useLogger() 设置为全局日志器
    ↓
整个应用使用自定义日志器
```

## 8. 关键时机的内存状态

### 应用启动前

```javascript
// DI 容器：空
container = new Map();
```

### forRoot 执行后

```javascript
// DI 容器：包含 logger
container = new Map([
  ['WINSTON_LOGGER', myLoggerInstance]
]);
```

### useLogger 执行后

```javascript
// 全局状态
globalLogger = myLoggerInstance;  // NestJS 全局日志器指向我们的实例
```

## 9. 验证流程是否正确

你可以添加一些调试代码来验证：

```javascript
// winston.module.ts
export class WinstonModule {
  public static forRoot(options: LoggerOptions): DynamicModule {
    console.log('🔧 forRoot 被调用，创建 MyLogger 实例');
    const loggerInstance = new MyLogger(options);
    console.log('✅ MyLogger 实例创建完成');
    
    return {
      module: WinstonModule,
      providers: [
        { provide: WINSTON_LOGGER_TOKEN, useValue: loggerInstance },
      ],
      exports: [WINSTON_LOGGER_TOKEN],
    };
  }
}

// MyLogger.ts
export class MyLogger implements LoggerService {
  constructor(options) {
    console.log('🏗️ MyLogger 构造函数被调用');
    this.logger = createLogger(options);
    console.log('✅ Winston Logger 创建完成');
  }
}

// main.ts
async function bootstrap() {
  console.log('🚀 开始创建 NestJS 应用');
  const app = await NestFactory.create(AppModule);
  console.log('📦 应用创建完成，获取 Logger 实例');
  
  const logger = app.get(WINSTON_LOGGER_TOKEN);
  console.log('📝 设置为全局日志器');
  app.useLogger(logger);
  
  await app.listen(3000);
  console.log('🎉 应用启动完成');
}
```

## 总结

**整个流程的核心理解：**

1. **forRoot()** 是一个**工厂函数**，根据配置创建实例
2. **DynamicModule** 是配置对象，告诉 NestJS 如何注册服务
3. **依赖注入容器** 存储了所有的服务实例
4. **app.get()** 从容器中获取服务实例
5. **app.useLogger()** 设置全局日志器

**关键时刻：**

- `forRoot` 调用时：创建并配置 MyLogger 实例
- `app.get` 调用时：从 DI 容器获取同一个实例
- `useLogger` 调用时：将实例设置为全局日志器

这样，你的自定义 Winston 日志器就成功替换了 NestJS 的默认日志器！





## 🚀 使用 nest-winston 替换你的自定义实现

### 1. 安装依赖

bash

```bash
npm install nest-winston winston winston-daily-rotate-file
```

### 2. 修改 app.module.ts

javascript

```javascript
import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { transports, format } from 'winston';
import * as chalk from 'chalk';

@Module({
  imports: [
    WinstonModule.forRoot({
      level: 'debug',
      transports: [
        new transports.Console({
          format: format.combine(
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            format.colorize(),
            format.printf(({ context, level, message, timestamp }) => {
              const appStr = chalk.green(`[NEST]`);
              const contextStr = chalk.yellow(`[${context || 'Application'}]`);
              return `${appStr} ${contextStr} ${level} ${timestamp} ${message}`;
            }),
          ),
        }),
        new transports.DailyRotateFile({
          filename: 'application-%DATE%.log',
          dirname: 'logs',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: format.combine(format.timestamp(), format.json()),
        }),
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 3. 修改 app.controller.ts

javascript

```javascript
import { Controller, Get, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Controller()
export class AppController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly appService: AppService,
  ) {}

  @Get()
  getHello(): string {
    this.logger.info('hello', { context: AppController.name });
    return this.appService.getHello();
  }
}
```

### 4. 修改 main.ts

javascript

```javascript
import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

## 🎯 关键变化

**删除的文件：**

- `MyLogger.ts` - 不需要了
- `winston/winston.module.ts` - 不需要了

**主要区别：**

1. **导入**：`WinstonModule` 来自 `nest-winston`
2. **Token**：使用 `WINSTON_MODULE_PROVIDER` 和 `WINSTON_MODULE_NEST_PROVIDER`
3. **注入**：直接注入 `Logger`（Winston 的原生 Logger）

## 💡 nest-winston 的优势

- ✅ **开箱即用**：不需要自己实现 LoggerService 接口
- ✅ **完美集成**：提供了专门的 NestJS 适配器
- ✅ **两种使用方式**：既可以注入 Winston Logger，也可以作为 NestJS Logger
- ✅ **社区维护**：bug 修复和功能更新有保障

## 🔄 迁移步骤

1. 安装 `nest-winston`
2. 替换 imports 中的 WinstonModule
3. 更新 controller 中的注入方式
4. 更新 main.ts 中的 useLogger 调用
5. 删除自定义的 MyLogger 和 winston.module.ts

这样你就能用几行代码实现同样的功能，而且更稳定可靠！

## 配置输出

 使用 `app.useLogger()` 设置 nest-winston 后，NestJS 的所有内部日志输出都会按照你的 transports 配置进行输出。

## 🎯 具体会输出什么？

### NestJS 内部的日志输出包括：

- **应用启动信息**：端口监听、模块初始化等
- **路由映射信息**：Controller 路由注册
- **依赖注入信息**：Provider 创建和注入
- **中间件执行信息**
- **错误和异常信息**
- **应用关闭信息**

## 📝 实际效果演示

启动应用时你会在**控制台**和**日志文件**中都看到：

bash

```bash
# 控制台输出（带颜色）
[NEST] [InstanceLoader] info 2024-01-17 14:30:00 AppModule dependencies initialized
[NEST] [RoutesResolver] info 2024-01-17 14:30:00 AppController {/}: 
[NEST] [RouterExplorer] info 2024-01-17 14:30:00 Mapped {/, GET} route
[NEST] [NestApplication] info 2024-01-17 14:30:00 Nest application successfully started
```

json

```json
// logs/application-2024-01-17.log 文件内容
{"level":"info","message":"AppModule dependencies initialized","timestamp":"2024-01-17T06:30:00.000Z","context":"InstanceLoader"}
{"level":"info","message":"AppController {/}:","timestamp":"2024-01-17T06:30:00.000Z","context":"RoutesResolver"}
{"level":"info","message":"Mapped {/, GET} route","timestamp":"2024-01-17T06:30:00.000Z","context":"RouterExplorer"}
{"level":"info","message":"Nest application successfully started","timestamp":"2024-01-17T06:30:00.000Z","context":"NestApplication"}
```

## 🔧 如果你想分离系统日志和业务日志

可以配置不同的 transport：

javascript

```javascript
WinstonModule.forRoot({
  level: 'debug',
  transports: [
    // 控制台：所有日志
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    }),
    
    // 系统日志文件：只记录 NestJS 内部日志
    new transports.DailyRotateFile({
      filename: 'system-%DATE%.log',
      dirname: 'logs',
      datePattern: 'YYYY-MM-DD',
      format: format.combine(
        format.timestamp(),
        format.json(),
        // 过滤：只记录特定 context 的日志
        format((info) => {
          const systemContexts = ['InstanceLoader', 'RoutesResolver', 'RouterExplorer', 'NestApplication'];
          return systemContexts.includes(info.context) ? info : false;
        })()
      )
    }),
    
    // 业务日志文件：只记录应用业务日志
    new transports.DailyRotateFile({
      filename: 'business-%DATE%.log',
      dirname: 'logs',
      datePattern: 'YYYY-MM-DD',
      format: format.combine(
        format.timestamp(),
        format.json(),
        // 过滤：排除系统日志
        format((info) => {
          const systemContexts = ['InstanceLoader', 'RoutesResolver', 'RouterExplorer', 'NestApplication'];
          return !systemContexts.includes(info.context) ? info : false;
        })()
      )
    }),
  ],
})
```

## 🎛️ 控制输出级别

如果你觉得系统日志太多，可以调整级别：

```javascript
// 只记录 warn 及以上级别，减少 info 日志
WinstonModule.forRoot({
  level: 'warn',  // 系统启动信息就不会记录了
  transports: [...]
})
```

## 总结

- ✅ **是的**，nest-winston 会捕获所有 NestJS 的内部日志
- 📝 **同时输出**到控制台和文件（根据你的 transports 配置）
- 🎯 **可以过滤**，通过 format 函数分离系统和业务日志
- 🔧 **可以控制**，通过 level 调整输出详细程度

这就是为什么推荐用 nest-winston，它能完美接管 NestJS 的日志系统！
