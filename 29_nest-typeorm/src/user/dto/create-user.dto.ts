import { IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(1, 50, { message: '用户名长度必须在1-50字符之间' })
  name: string;
}
