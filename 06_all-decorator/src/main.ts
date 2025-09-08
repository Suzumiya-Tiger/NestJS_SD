import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 设置session,这里可以实现session的持久化
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'default_secret_for_development',
      resave: false, // 不强制保存未修改的 session
      saveUninitialized: true, // 保存新的空 session
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30天过期
        httpOnly: true, // 只能服务器访问，防止 XSS
        secure: false, // HTTP 也可以用（开发环境）
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
