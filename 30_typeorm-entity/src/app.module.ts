import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CityModule } from './city/city.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { City } from './city/entities/city.entity';

@Module({
  imports: [
    CityModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      username: 'root',
      password: '177376',
      database: 'tree_test',

      // 开发环境配置
      synchronize: process.env.NODE_ENV !== 'production', // 生产环境关闭
      logging: process.env.NODE_ENV === 'development', // 开发环境开启日志

      // 实体配置
      entities: [City],
      autoLoadEntities: true, // 自动加载 forFeature 注册的实体

      // 连接池配置
      poolSize: 10,
      acquireTimeout: 60000,

      // MySQL 特定配置
      connectorPackage: 'mysql2',
      extra: {
        authPlugin: 'sha256_password',
        connectionLimit: 10,
      },

      // 重试配置
      retryAttempts: 5,
      retryDelay: 3000,
    }),
    CityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
