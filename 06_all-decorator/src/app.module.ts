import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LogModule } from './log/log.module';
import { HeinrichService } from './heinrich';
import { Global, Module } from '@nestjs/common';
import { AaaController } from './aaa.controller';
@Global()
@Module({
  imports: [LogModule],
  controllers: [AppController, AaaController],
  providers: [
    AppService,
    HeinrichService,
    {
      provide: 'Guang',
      useFactory() {
        return {
          name: 'guang',
        };
      },
    },
  ],
})
export class AppModule {}
