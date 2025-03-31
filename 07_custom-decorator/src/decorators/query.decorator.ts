import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express'; // 修改这行

export const MyQuery = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    return key ? request.query[key] : request.query;
  },
);
