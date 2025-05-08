import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BbbModule } from './bbb/bbb.module';
import { AaaModule } from './aaa/aaa.module';
import { CccService } from './ccc.service';
import { DddService } from './ddd.service';

@Module({
  imports: [BbbModule, AaaModule],
  controllers: [AppController],
  providers: [AppService, CccService, DddService],
})
export class AppModule {}
