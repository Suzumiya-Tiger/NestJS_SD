import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }
  @Inject(ConfigService)
  private configService: ConfigService;
  @Get()
  getHello(): any {
    return {
      config: this.configService.get('aaa.bbb.ccc'),
      port: this.configService.get('application.port'),
    };
  }
}
