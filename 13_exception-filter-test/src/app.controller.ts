import {
  Controller,
  Get,
  BadRequestException,
  // UseFilters,
  Post,
  Body,
} from '@nestjs/common';
import { AppService } from './app.service';
// import { HelloFilter } from './hello.filter';
import { AaaDto } from './aaa.dto';
// import { UnloginException } from './unlogin.filter';
@Controller()
// @UseFilters(HelloFilter)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    throw new BadRequestException('xxxx');
  }

  @Post('aaa')
  aaa(@Body() aaaDto: AaaDto) {
    console.log('aaaDto', aaaDto);

    return 'success';
  }

  // @Get('bbb')
  // bbb() {
  //   throw new UnloginException();
  // }
}
