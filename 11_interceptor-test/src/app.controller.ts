import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { AaaInterceptor } from './aaa.interceptor';
import { MapTestInterceptor } from './map-test.interceptor';
import { TapTestInterceptor } from './tap-test.interceptor';
import { CatchErrorTestInterceptor } from './catch-error-test.interceptor';
import { TimeoutInterceptor } from './timeout.interceptor';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseInterceptors(AaaInterceptor)
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('aaa')
  @UseInterceptors(MapTestInterceptor)
  getAaa(): string {
    return this.appService.getHello();
  }

  @Get('bbb')
  @UseInterceptors(TapTestInterceptor)
  getBbb(): string {
    return this.appService.getHello();
  }

  @Get('ccc')
  @UseInterceptors(CatchErrorTestInterceptor)
  getCcc(): string {
    throw new Error('xxx');
    return this.appService.getHello();
  }

  @Get('ddd')
  @UseInterceptors(TimeoutInterceptor)
  async getDdd(): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 4000));
    return 'ddd';
  }

  @Get('eee')
  eee() {
    return 'eeee';
  }
}
