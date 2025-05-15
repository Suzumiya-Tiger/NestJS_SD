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
