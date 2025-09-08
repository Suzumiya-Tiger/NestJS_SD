import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('log')
  log(@Body() body: any) {
    // 使用@Body装饰器来获取请求体
    console.log('body', body);
  }
}
