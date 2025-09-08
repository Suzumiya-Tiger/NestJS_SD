import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
// import { HelloFilter } from './hello.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 自动类型转换
      whitelist: true, // 只保留 DTO 中定义的属性
      forbidNonWhitelisted: true, // 遇到额外属性时报错
    }),
  ); // app.useGlobalFilters(new HelloFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
