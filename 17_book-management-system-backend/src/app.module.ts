import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { APP_PIPE } from '@nestjs/core';
import { DbModule } from './db/db.module';
import { BookModule } from './book/book.module';

@Module({
  imports: [UserModule, DbModule, BookModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        // 过滤掉请求体中没有的属性
        whitelist: true,
        // 将请求体中的属性转换为指定的类型
        transform: true,
        // 如果请求体中存在没有的属性，则抛出异常
        forbidNonWhitelisted: true,
        // 如果请求体中存在未知属性，则抛出异常
        forbidUnknownValues: true,
      }),
    },
  ],
})
export class AppModule {}
