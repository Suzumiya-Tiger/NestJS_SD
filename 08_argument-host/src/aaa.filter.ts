import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { AaaException } from './AaaException';
import { Request, Response } from 'express';
@Catch(AaaException)
export class AaaFilter implements ExceptionFilter {
  catch(exception: AaaException, host: ArgumentsHost) {
    if (host.getType() === 'http') {
      // 获取http上下文
      const ctx = host.switchToHttp();
      // 获取响应对象
      const response = ctx.getResponse<Response>();
      // 获取请求对象
      const request = ctx.getRequest<Request>();

      response.status(500).json({
        errCode: exception.errorCode,
        errMessage: exception.errorMessage,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
