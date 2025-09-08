import {  LoggerService } from '@nestjs/common';

import { createLogger, Logger } from 'winston';
import 'winston-daily-rotate-file';

export class MyLogger implements LoggerService {
  private logger: Logger;
  constructor(options) {
    this.logger = createLogger(options);
  }

  log(message: string, context: string) {
    this.logger.log('info', message, { context });
  }
  error(message: string, context: string) {
    this.logger.log('error', message, { context });
  }
  warn(message: string, context: string) {
    this.logger.log('warn', message, { context });
  }
  debug(message: string, context: string) {
    this.logger.log('debug', message, { context });
  }
}
