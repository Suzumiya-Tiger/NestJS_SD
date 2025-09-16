// user/user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // 为这个模块注册 User 实体
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // 导出 UserService，供其他模块使用
})
export class UserModule { }
