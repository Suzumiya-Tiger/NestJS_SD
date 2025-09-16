import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from './dto/pagination.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 在类外部添加辅助函数
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '未知错误';
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  // 创建用户
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // 检查用户名是否已存在
      const existingUser = await this.userRepository.findOne({
        where: { name: createUserDto.name },
      });

      if (existingUser) {
        throw new BadRequestException('该用户名已被使用');
      }

      // 创建并保存用户
      const user = this.userRepository.create(createUserDto);
      return await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `创建用户失败: ${getErrorMessage(error)}`,
      );
    }
  }

  // 查询所有用户
  async findAll(): Promise<User[]> {
    try {
      return await this.userRepository.find({
        order: { id: 'DESC' }, // 按 ID 降序排列
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `查询用户列表失败: ${getErrorMessage(error)}`,
      );
    }
  }

  // 根据 ID 查询单个用户
  async findOne(id: number): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`ID 为 ${id} 的用户不存在`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `查询用户失败: ${getErrorMessage(error)}`,
      );
    }
  }

  // 更新用户
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      // 先检查用户是否存在
      const existingUser = await this.userRepository.findOne({
        where: { id },
      });
      if (!existingUser) {
        throw new NotFoundException(`ID 为 ${id} 的用户不存在`);
      }
      if (!updateUserDto || !updateUserDto.name) {
        throw new BadRequestException('更新用户名不能为空');
      }
      // 如果更新用户名，检查是否与其他用户重复
      const newName = updateUserDto.name;
      if (newName && newName !== existingUser.name) {
        const duplicateUser = await this.userRepository.findOne({
          where: { name: newName },
        });
        if (duplicateUser) {
          throw new BadRequestException('该用户名已被其他用户使用');
        }
      }
      // 执行更新
      await this.userRepository.update(id, updateUserDto);

      // 返回更新后的用户
      return await this.findOne(id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `更新用户失败: ${getErrorMessage(error)}`,
      );
    }
  }

  // 删除用户
  async remove(id: number): Promise<{ message: string; deletedId: number }> {
    try {
      // 先检查用户是否存在
      await this.findOne(id);

      // 执行删除
      const result = await this.userRepository.delete(id);

      if (result.affected === 0) {
        throw new InternalServerErrorException('删除操作未影响任何记录');
      }

      return {
        message: `用户删除成功`,
        deletedId: id,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `删除用户失败: ${getErrorMessage(error)}`,
      );
    }
  }

  // 根据用户名查询用户
  async findByName(name: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: { name },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `查询用户失败: ${getErrorMessage(error)}`,
      );
    }
  }

  // 分页查询
  async findWithPagination(
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<User>> {
    try {
      const { page = 1, limit = 10 } = paginationDto;

      const [users, total] = await this.userRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { id: 'DESC' },
      });

      return {
        data: users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `分页查询失败: ${getErrorMessage(error)}`,
      );
    }
  }

  // 事务操作示例
  async createMultipleUsers(createUserDtos: CreateUserDto[]): Promise<User[]> {
    try {
      return await this.userRepository.manager.transaction(
        async (transactionalEntityManager) => {
          const users: User[] = [];

          for (const dto of createUserDtos) {
            // 检查用户名唯一性
            const existingUser = await transactionalEntityManager.findOne(
              User,
              {
                where: { name: dto.name },
              },
            );

            if (existingUser) {
              throw new BadRequestException(`用户名 ${dto.name} 已存在`);
            }

            const user = transactionalEntityManager.create(User, dto);
            const savedUser = await transactionalEntityManager.save(user);
            users.push(savedUser);
          }

          return users;
        },
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `批量创建用户失败: ${getErrorMessage(error)}`,
      );
    }
  }

  // 搜索用户（按姓名模糊查询）
  async searchByName(name: string): Promise<User[]> {
    try {
      return await this.userRepository
        .createQueryBuilder('user')
        .where('user.name LIKE :name', { name: `%${name}%` })
        .orderBy('user.id', 'DESC')
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException(
        `搜索用户失败: ${getErrorMessage(error)}`,
      );
    }
  }

  // 统计用户总数
  async count(): Promise<number> {
    try {
      return await this.userRepository.count();
    } catch (error) {
      throw new InternalServerErrorException(
        `统计用户失败: ${getErrorMessage(error)}`,
      );
    }
  }

  // 检查用户名是否存在
  async isNameExists(name: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({ where: { name } });
      return !!user;
    } catch (error) {
      throw new InternalServerErrorException(
        `检查用户名失败: ${getErrorMessage(error)}`,
      );
    }
  }
}
