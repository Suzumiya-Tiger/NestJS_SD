import {
  Module,
  OnModuleInit,
  OnApplicationBootstrap,
  OnModuleDestroy,
  BeforeApplicationShutdown,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CccService } from './ccc.service';
import { CccController } from './ccc.controller';

@Module({
  controllers: [CccController],
  providers: [CccService],
})
export class CccModule
  implements
    OnModuleInit,
    OnApplicationBootstrap,
    OnModuleDestroy,
    BeforeApplicationShutdown,
    OnApplicationShutdown
{
  constructor(private readonly moduleRef: ModuleRef) {}
  onModuleInit() {
    console.log('CccModule has been initialized');
  }
  onApplicationBootstrap() {
    console.log('CccApplication has been bootstrapped');
  }
  onModuleDestroy() {
    console.log('CccModule has been destroyed');
  }
  beforeApplicationShutdown(signal: string) {
    console.log('CccApplication has been shutdown', signal);
  }
  onApplicationShutdown(signal: string) {
    const cccService = this.moduleRef.get<CccService>(CccService);
    console.log('--------------------------------', cccService.findAll());

    console.log('CccApplication has been shutdown', signal);
  }
}
