import { IsNotEmpty, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty({ message: '用户名不得为空' })
  username: string;
  @IsNotEmpty({ message: '密码不得为空' })
  @MinLength(6, { message: '密码长度不得小于6位' })
  password: string;
}
