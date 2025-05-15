import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { MyLogger } from './MyLogger';
import { MyLogger3 } from './MyLogger3';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // 自定义
    // logger: new MyLogger(),
    /* bufferLogs 就是先不打印日志，把它放到 buffer 缓冲区，直到用 useLogger 指定了 Logger 并且应用初始化完毕。 */
    bufferLogs: true,
  });
  app.useLogger(app.get(MyLogger3));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
