import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DbService } from 'src/db/db.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { User } from './entities/user.entity';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserService {
  @Inject(DbService)
  private readonly dbService: DbService;

  async register(registerUserDto: RegisterUserDto) {
    const users = (await this.dbService.read()) as User[];
    const foundUser = users.find(
      (item) => item.username === registerUserDto.username,
    );
    if (foundUser) {
      throw new BadRequestException('用户已注册');
    }
    const user = new User();
    user.username = registerUserDto.username;
    user.password = registerUserDto.password;
    users.push(user);
    await this.dbService.write(users);
    return user;
  }

  async login(loginUserDto: LoginUserDto) {
    const users = (await this.dbService.read()) as User[];
    const foundUser = users.find(
      (item) =>
        item.username === loginUserDto.username &&
        item.password === loginUserDto.password,
    );
    if (!foundUser) {
      throw new BadRequestException('用户名或密码错误');
    }
    return '登录成功';
  }
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
