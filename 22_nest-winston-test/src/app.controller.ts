import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { MyLogger } from './MyLogger';
import { WINSTON_LOGGER_TOKEN } from './winston/winston.module';

@Controller()
export class AppController {
  @Inject()
  private appService: AppService;
  // private logger = new Logger();
  @Inject(WINSTON_LOGGER_TOKEN)
  private logger: MyLogger;
  @Get()
  getHello(): string {
    this.logger.log('hello', AppController.name);
    return this.appService.getHello();
  }
}
