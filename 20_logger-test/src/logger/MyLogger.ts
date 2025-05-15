import { ConsoleLogger } from '@nestjs/common';

export class MyLogger extends ConsoleLogger {
  // 继承后指定哪个日志类型的方法自定义重写
  log(message: string, context: string) {
    console.log(`[${context}]`, message);
  }
}
