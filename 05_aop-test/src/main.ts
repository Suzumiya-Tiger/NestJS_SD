import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NextFunction, Request, Response } from 'express';
import { TimeInterceptor } from './time.interceptor';
// import { LoginGuard } from './login.guard';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(function (req: Request, res: Response, next: NextFunction) {
    console.log('before', req.url);

    next();
    console.log('after', req.url);
  });
  app.useGlobalInterceptors(new TimeInterceptor());
  // app.useGlobalGuards(new LoginGuard());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
// 添加一些注释
