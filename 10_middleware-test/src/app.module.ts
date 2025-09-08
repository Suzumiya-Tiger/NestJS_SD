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
    // 方案1：为所有路由应用中间件
    // consumer.apply(AaaMiddleware).forRoutes('*'); // 匹配所有路由
    // 或者方案2：指定具体的路由
    consumer
      .apply(AaaMiddleware)
      .forRoutes('hello', 'hello2', 'world1', 'world2');
    // 或者方案3：使用正确的通配符语法（如果需要路径匹配）
    // consumer
    //   .apply(AaaMiddleware)
    //   .forRoutes({ path: 'hello/:path*', method: RequestMethod.GET });
    // consumer
    //   .apply(AaaMiddleware)
    //   .forRoutes({ path: 'world/:path*', method: RequestMethod.GET });
  }
}
