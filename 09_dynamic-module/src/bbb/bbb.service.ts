import { Inject, Injectable } from '@nestjs/common';
import { CreateBbbDto } from './dto/create-bbb.dto';
import { UpdateBbbDto } from './dto/update-bbb.dto';

@Injectable()
export class BbbService {
  constructor(
    @Inject('CONFIG_OPTIONS') private readonly options: Record<string, any>,
  ) {}
  create(createBbbDto: CreateBbbDto) {
    return 'This action adds a new bbb';
  }

  findAll() {
    console.log('this.options', this.options);

    return `This action returns all bbb`;
  }

  findOne(id: number) {
    return `This action returns a #${id} bbb`;
  }

  update(id: number, updateBbbDto: UpdateBbbDto) {
    return `This action updates a #${id} bbb`;
  }

  remove(id: number) {
    return `This action removes a #${id} bbb`;
  }
}
