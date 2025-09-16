import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleModule } from './article/article.module';
import { AppDataSource } from './data-source'; // 导入 data-source 配置
import { BbbModule } from './bbb/bbb.module';
import * as path from 'path'; // 添加这行
import config2 from 'config2';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.join(__dirname, '.env'),
      // 如果你想自己写配置，也可以直接写入config.ts
      load: [config2],
    }),
    TypeOrmModule.forRoot(AppDataSource.options), // 使用 data-source 的配置
    ArticleModule,
    BbbModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
