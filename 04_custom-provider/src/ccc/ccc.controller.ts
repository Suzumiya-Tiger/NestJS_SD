import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  OnModuleInit,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { CccService } from './ccc.service';
import { CreateCccDto } from './dto/create-ccc.dto';
import { UpdateCccDto } from './dto/update-ccc.dto';

@Controller('ccc')
export class CccController implements OnModuleInit, OnApplicationBootstrap {
  constructor(private readonly cccService: CccService) {}

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
    console.log('CccApplication has been shutdown', signal);
  }

  @Post()
  create(@Body() createCccDto: CreateCccDto) {
    return this.cccService.create(createCccDto);
  }

  @Get()
  findAll() {
    return this.cccService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cccService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCccDto: UpdateCccDto) {
    return this.cccService.update(+id, updateCccDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cccService.remove(+id);
  }
}
