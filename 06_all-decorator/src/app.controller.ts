import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
  Post,
  Body,
  SetMetadata,
  Headers,
  Ip,
  Session,
} from '@nestjs/common';
import { AppService } from './app.service';
import { TestFilter } from './test.filter';
import { AuthGuardGuard } from './auth-guard.guard';
import { AaaInterceptorInterceptor } from './aaa-interceptor.interceptor';
import { ParseIntPipe, ParseBoolPipe } from './validate.pipe';
import { AaaDto } from './dto/aaa.dto';
@Controller()
@SetMetadata('roles', ['user'])
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Inject('Guang')
  private readonly guang: Record<string, any>;
  @Get()
  @UseFilters(TestFilter)
  @UseGuards(AuthGuardGuard)
  @UseInterceptors(AaaInterceptorInterceptor)
  @SetMetadata('roles', ['admin'])
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

  @Post('/bbb')
  getHello3(@Body() aaa: AaaDto) {
    console.log('aaa', aaa);
  }

  @Get('/ccc')
  // 获取请求头
  header(@Headers('Accept') accept: string, @Headers() headers: any) {
    console.log(accept, headers);
  }

  @Get('/ip')
  ip(@Ip() ip: string) {
    console.log('ip', ip);
  }

  @Get('/session')
  session(@Session() session: Record<string, any>) {
    if (!session.count) {
      session.count = 0;
    }
    session.count++;
    return session.count;
  }
}
