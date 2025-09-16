import { Injectable } from '@nestjs/common';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { City } from './entities/city.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';

@Injectable()
export class CityService {
  constructor(
    @InjectRepository(City)
    private cityRepository: TreeRepository<City>,
  ) { }
  create(createCityDto: CreateCityDto) {
    console.log('createCityDto', createCityDto);

    return 'This action adds a new city';
  }

  async findAll() {
    /*     const city = this.cityRepository.create({
      name: '华北',
    });
    await this.cityRepository.save(city);
    const cityChild = this.cityRepository.create({
      name: '山东',
      parent: city,
    });

    const parent = await this.cityRepository.findOne({
      where: {
        name: '华北',
      },
    });
    if (parent) {
      cityChild.parent = parent;
    }
    await this.cityRepository.save(cityChild);

    return this.cityRepository.findTrees(); */

    /*     const city = this.cityRepository.create({
      name: '华南',
    });
    await this.cityRepository.save(city);
    const cityChild = this.cityRepository.create({
      name: '广东',
    });

    const parent = await this.cityRepository.findOne({
      where: {
        name: '华南',
      },
    });
    if (parent) {
      cityChild.parent = parent;
    }
    await this.cityRepository.save(cityChild);

    const cityChild2 = this.cityRepository.create({
      name: '广州',
    });
    const parent2 = await this.cityRepository.findOne({
      where: {
        name: '广东',
      },
    });
    if (parent2) {
      cityChild2.parent = parent2;
    }
    await this.cityRepository.save(cityChild2); */

    // 查询铺开的整个树节点
    // return this.cityRepository.findTrees();
    // 查询根节点
    // return this.cityRepository.findRoots();

    /* findAncestors、findDescendants 会用扁平结构返回查询结果，不带children等parent,只有若干独立节点信息 */
    // 查询某个节点下所有子节点
    /*     const parent = await this.cityRepository.findOne({
      where: {
        name: '广东',
      },
    });
    if (parent) {
      return this.cityRepository.findDescendants(parent);
    } */
    //  查询某个节点的所有祖宗节点
    const city = await this.cityRepository.findOne({
      where: {
        name: '广州',
      },
    });
    if (city) {
      return this.cityRepository.findAncestorsTree(city);
    }
    return [];
  }

  findOne(id: number) {
    return `This action returns a #${id} city`;
  }

  update(id: number, updateCityDto: UpdateCityDto) {
    return `This action updates a #${id} city`;
  }

  remove(id: number) {
    return `This action removes a #${id} city`;
  }
}
