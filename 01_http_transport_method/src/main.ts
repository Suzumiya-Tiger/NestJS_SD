import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
async function bootstrap() {
  //要给 create 方法传入 NestExpressApplication 的泛型参数才有 useStaticAssets这些方法
  //NestExpressApplication 是 NestFactory 的泛型参数
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets('public', { prefix: '/static' });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
