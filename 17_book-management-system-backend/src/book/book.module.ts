import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { DbModule } from 'src/db/db.module';

@Module({
  imports: [
    // 导入动态模块(数据库)请应用register来注册数据库的路径
    DbModule.register({
      path: 'book.json',
    }),
  ],
  controllers: [BookController],
  providers: [BookService],
})
export class BookModule {}
