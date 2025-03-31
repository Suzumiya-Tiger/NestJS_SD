import {
  Injectable,
  OnModuleInit,
  OnApplicationBootstrap,
  OnModuleDestroy,
  BeforeApplicationShutdown,
  OnApplicationShutdown,
} from '@nestjs/common';
import { CreateCccDto } from './dto/create-ccc.dto';
import { UpdateCccDto } from './dto/update-ccc.dto';

@Injectable()
export class CccService implements OnModuleInit, OnApplicationBootstrap {
  onModuleInit() {
    console.log('CccModule has been initialized');
  }
  onApplicationBootstrap() {
    console.log('CccApplication has been bootstrapped');
  }
  create(createCccDto: CreateCccDto) {
    return 'This action adds a new ccc';
  }

  onModuleDestroy() {
    console.log('CccModule has been destroyed');
  }
  beforeApplicationShutdown(signal: string) {
    console.log('CccApplication has been shutdown', signal);
  }
  onApplicationShutdown(signal: string) {
    console.log('CccApplication has been shutdown', signal);
  }

  findAll() {
    return `This action returns all ccc`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ccc`;
  }

  update(id: number, updateCccDto: UpdateCccDto) {
    return `This action updates a #${id} ccc`;
  }

  remove(id: number) {
    return `This action removes a #${id} ccc`;
  }
}
