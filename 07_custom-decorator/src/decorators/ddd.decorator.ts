import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from '@nestjs/common';
export const MyHeaders = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    return key ? request.headers[key.toLowerCase()] : request.headers;
  },
);
