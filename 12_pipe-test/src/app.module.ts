import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_PIPE } from '@nestjs/core';
import { MyValidationPipe } from './myvalidationPipe';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    /*     {
      provide: APP_PIPE,
      useClass: MyValidationPipe,
    }, */
  ],
})
export class AppModule { }
