import { Global, Module } from '@nestjs/common';
import { MyLogger } from './MyLogger';

@Global()
@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
