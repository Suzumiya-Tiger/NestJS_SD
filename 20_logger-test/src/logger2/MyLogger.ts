import { ConsoleLogger, Inject } from '@nestjs/common';

export class MyLogger extends ConsoleLogger {
  @Inject('LOG_OPTIONS')
  declare public options: Record<string, any>;

  log(message: string, context: string) {
    console.log('options', this.options);
    console.log(`[${context}]`, message);
    console.log('--------------------------------');
  }
}
