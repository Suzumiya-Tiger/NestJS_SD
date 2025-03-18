import {
  Controller,
  Get,
  HostParam,
  HttpCode,
  Next,
  Redirect,
  Req,
  Res,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Controller({ host: ':host.0.0.1', path: 'aaa' })
export class AaaController {
  // 获取主机
  @Get('bbb')
  hello(@HostParam('host') host: string) {
    return `hello ${host}`;
  }
  // 获取请求
  @Get('ccc')
  ccc(@Req() req: Request) {
    console.log(req.headers);
    console.log(req.body);
    return 'ccc';
  }
  // 获取响应
  @Get('ddd')
  ddd(@Res() res: Response) {
    res.end('ddd');
  }
  // 获取下一个中间件
  @Get('eee')
  eee(@Next() next: NextFunction) {
    console.log('ahndler1');
    next();

    return 'handler2';
  }
  // 获取下一个中间件
  @Get('eee')
  eee2() {
    console.log('handler2');
    return 'handler3';
  }

  // 修改http状态码
  @Get('fff')
  fff(@Res() res: Response) {
    res.status(404).send('fff');
  }

  @Get('ggg')
  @HttpCode(201)
  ggg() {
    console.log('ggg');
  }

  // 指定路由重定向的url
  @Get('hhh')
  @Redirect('https://www.baidu.com', 301)
  hhh() {}
  // 在返回值的地方设置url，也可以实现带参数的重定向
  @Get('xxx')
  @Redirect()
  jump() {
    return {
      url: 'https://www.baidu.com',
      statusCode: 302,
    };
  }
}
