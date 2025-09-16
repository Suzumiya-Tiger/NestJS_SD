// user/dto/pagination.dto.ts
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional() // 表示 page 字段是可选的
  @Type(() => Number)
  @IsInt() // 只有当 page 有值时才验证是否为整数
  @Min(1) // 只有当 page 有值时才验证是否 >= 1
  page?: number = 1;

  @IsOptional() // 表示 limit 字段是可选的
  @Type(() => Number)
  @IsInt() // 只有当 limit 有值时才验证
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
