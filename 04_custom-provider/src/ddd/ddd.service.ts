import { Injectable } from '@nestjs/common';
import { CreateDddDto } from './dto/create-ddd.dto';
import { UpdateDddDto } from './dto/update-ddd.dto';
import { OnModuleInit, OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class DddService implements OnModuleInit, OnApplicationBootstrap {
  onModuleInit() {
    console.log('DddModule has been initialized');
  }

  onApplicationBootstrap() {
    console.log('DddApplication has been bootstrapped');
  }

  findAll() {
    return `This action returns all ddd`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ddd`;
  }

  update(id: number, updateDddDto: UpdateDddDto) {
    return `This action updates a #${id} ddd`;
  }

  remove(id: number) {
    return `This action removes a #${id} ddd`;
  }
}
