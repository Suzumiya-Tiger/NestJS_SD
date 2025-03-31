import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

export class UnloginException extends HttpException {
  constructor(message?: string) {
    super(message ?? '未登录', HttpStatus.UNAUTHORIZED);
  }
}

@Catch(UnloginException)
export class UnloginFilter implements ExceptionFilter {
  catch(exception: UnloginException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();

    response.status(HttpStatus.UNAUTHORIZED).json({
      code: HttpStatus.UNAUTHORIZED,
      message: exception.message,
    });
  }

  // ... existing code ...
}
