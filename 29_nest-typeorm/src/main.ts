import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动移除不在 DTO 中的属性
      forbidNonWhitelisted: true, // 当有额外属性时抛出错误
      transform: true, // 自动转换类型
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
