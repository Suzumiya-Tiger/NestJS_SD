import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { AaaGuard } from './aaa.guard';
import { Aaa } from './decorators/aaa.decorator';
import { Bbb } from './decorators/bbb.decorator';
import { Ccc } from './decorators/ccc.decorator';
import { MyHeaders } from './decorators/ddd.decorator';
import { MyQuery } from './decorators/query.decorator';
import { GetClassCto } from './decorators/getClass.decorator';

@GetClassCto('eee', 'heinrich')
// @Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @SetMetadata('aaa', 'admin')
  @Aaa('admin')
  @UseGuards(AaaGuard)
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('hello')
  @Aaa('admin')
  @UseGuards(AaaGuard)
  getHello2(): string {
    return this.appService.getHello();
  }
  // 使用applyDecorators装饰器整合出来的装饰器集合应用
  @Bbb('hello', 'admin')
  getHello3(): string {
    return this.appService.getHello();
  }

  @Get('hello4')
  getHello4(@Ccc() ccc: string): string {
    return ccc;
  }

  @Get('hello5')
  getHello5(@MyHeaders('authorization') authorization: string): string {
    console.log('authorization', authorization);

    return authorization;
  }

  @Get('hello6')
  getHello6(
    @Query('name') name: string,
    @MyQuery('address') address: string,
  ): string {
    console.log('name', name);
    console.log('address', address);

    return name;
  }

  @Get('hello7')
  getHello7(
    @Query('aaa', new ParseIntPipe()) aaa: number,
    @MyQuery('bbb', new ParseIntPipe()) bbb: number,
  ) {
    console.log('aaa', aaa);
    console.log('bbb', bbb);

    return aaa + bbb;
  }
}
