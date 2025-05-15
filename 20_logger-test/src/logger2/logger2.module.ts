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
