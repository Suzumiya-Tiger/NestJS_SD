import { Controller, Get, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { AppService } from './app.service';
import { AaaService } from './aaa/aaa.service';
/* @Controller({
  path: 'aaa',
  version: VERSION_NEUTRAL,
}) */
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly aaaService: AaaService,
  ) {}
  // @Version('2')
  // @Get()
  // findAllV2() {
  //   return this.aaaService.findAll() + '222';
  // }
  @Get('aaa')
  @Version('1')
  getHello(): string {
    return this.appService.getHello();
  }
}
