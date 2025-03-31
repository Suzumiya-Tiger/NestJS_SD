import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
// @Contronller()被声明以后，下面的AppController也代表这个class是一个controller，
// 然后nest会根据这个controller的定义，自动生成一个路由，然后把这个路由注册到nest的路由系统中。
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
