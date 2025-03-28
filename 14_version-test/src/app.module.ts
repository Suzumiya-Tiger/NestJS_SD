import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AaaModule } from './aaa/aaa.module';
import { AaaController } from './aaa/aaa.controller';

@Module({
  imports: [AaaModule],
  controllers: [AppController, AaaController],
  providers: [AppService],
})
export class AppModule {}
