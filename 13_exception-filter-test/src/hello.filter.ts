import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AppService } from './app.service';
// ... existing code ...
@Catch()
export class HelloFilter<T extends HttpException> implements ExceptionFilter {
  @Inject(AppService)
  private readonly appService: AppService;
  catch(exception: T, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    // 获取异常状态码
    const statusCode = exception.getStatus();
    const res = exception.getResponse() as { message: string[] };
    response.status(statusCode).json({
      code: statusCode,
      message: res?.message?.join ? res.message.join(',') : exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
      appService: this.appService.getHello(),
    });
  }

  // ... existing code ...
}
