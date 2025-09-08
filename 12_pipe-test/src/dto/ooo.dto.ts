import {
  IsString,
  IsInt,
  IsBoolean,
  IsArray,
  IsNotEmpty,
} from 'class-validator';

export class Ooodto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  age: number;

  @IsBoolean()
  sex: boolean;

  @IsArray()
  @IsString({ each: true }) // 验证数组中每个元素都是字符串
  hobbies: Array<string>;
}
