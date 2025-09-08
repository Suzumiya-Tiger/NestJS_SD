import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  ParseFloatPipe,
  ParseIntPipe,
  Query,
  Post,
  Body,
  Param,
  ValidationPipe,
} from '@nestjs/common';
// 移除 ParseArrayPipe，使用内置的方式
import { AppService } from './app.service';
import { AaaPipe } from './aaa.pipe';
import { Ooodto } from './dto/ooo.dto';
import { MyValidationPipe } from './myvalidationPipe';

@Controller()
export class AppController {
  @Inject(AppService)
  private readonly appService: AppService;

  /* ParseIntPipe 参数转换 */
  @Get()
  // ParseIntPipe 字符串转数字
  /*   getHello(
    @Query(
      'aa',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    aa: string,
  ): string {
    return aa + 1;
  } */

  // 也可以通过exceptionFactory 自定义错误
  @Get()
  getHello(
    @Query(
      'aa',
      new ParseIntPipe({
        exceptionFactory: (msg) => {
          console.log('msg', msg);
          throw new HttpException('xxx ' + msg, HttpStatus.NOT_IMPLEMENTED);
        },
      }),
    )
    aa: string,
  ): string {
    return aa + 1;
  }

  /* ParseFloatPipe 参数转换 */
  @Get('cc')
  cc(@Query('cc', ParseFloatPipe) cc: number) {
    return cc + 1;
  }

  @Get('ee')
  ee(@Query('ee') ee: string) {
    // 手动解析数组字符串，例如: "1,2,3"
    const numbers = ee.split(',').map((item) => Number(item.trim()));
    return numbers.reduce((total, item) => total + item, 0);
  }

  @Get('nnn/:bbb')
  nnn(@Query('aaa', AaaPipe) aaa: string, @Param('bbb', AaaPipe) bbb: number) {
    return aaa + bbb;
  }
  @Post('ooo')
  ooo(@Body() obj: Ooodto) {
    console.log('obj', obj);
  }
}
