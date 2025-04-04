import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
// import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // app.useGlobalPipes(new ValidationPipe());

  app.enableCors();
  app.useStaticAssets(join(__dirname, '../my-uploads'), {
    prefix: '/my-uploads',
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
