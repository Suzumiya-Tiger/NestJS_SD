import { DynamicModule, Module } from '@nestjs/common';
import { DbService } from './db.service';
export interface DbModuleOptions {
  path: string;
}
@Module({})
export class DbModule {
  static register(options: DbModuleOptions): DynamicModule {
    return {
      module: DbModule, // 模块类
      providers: [
        {
          provide: 'OPTIONS', // 将参数注册为 provider
          useValue: options, // options = { path: 'user.json' }
        },
        DbService, // 业务服务
      ],
      exports: [DbService], // 导出给其他模块使用
    };
  }
}
