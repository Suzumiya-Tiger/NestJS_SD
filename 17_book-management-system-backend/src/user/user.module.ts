import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DbModule } from '../db/db.module';

@Module({
  imports: [
    // 这种需要传参的模块是动态模块来的，不能直接定义为静态模块
    // 采用工厂模式来生成一个支持运行时根据传入参数返回定制化的模块
    DbModule.register({
      path: 'user.json',
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
