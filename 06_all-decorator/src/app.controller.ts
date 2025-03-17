import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { AppService } from './app.service';
import { TestFilter } from './test.filter';
import { AuthGuardGuard } from './auth-guard.guard';
import { AaaInterceptorInterceptor } from './aaa-interceptor.interceptor';
import { ParseIntPipe, ParseBoolPipe } from './validate.pipe';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Inject('Guang')
  private readonly guang: Record<string, any>;
  @Get()
  @UseFilters(TestFilter)
  @UseGuards(AuthGuardGuard)
  @UseInterceptors(AaaInterceptorInterceptor)
  @UsePipes(ParseIntPipe)
  getHello(): string {
    console.log('guang', this.guang);
    // throw new HttpException('123', HttpStatus.BAD_REQUEST);
    return this.appService.getHello();
  }

  @Get('/xxx/:aaa')
  getHello2(
    @Param('aaa', ParseIntPipe) aaa: number,
    @Query('bbb', ParseBoolPipe) bbb: boolean,
  ) {
    console.log(typeof aaa, typeof bbb);
    console.log(aaa, bbb);
    return 'hello';
  }
}
