import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AaaMiddleware } from './aaa.middleware';
@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 重新指定middleware应用的路由
    consumer
      .apply(AaaMiddleware)
      .forRoutes({ path: 'hello/*JUHYGTFRDERF4', method: RequestMethod.GET });
    consumer
      .apply(AaaMiddleware)
      .forRoutes({ path: 'world/*', method: RequestMethod.GET });
  }
}
