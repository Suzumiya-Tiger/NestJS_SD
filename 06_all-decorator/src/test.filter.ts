import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
@Catch(HttpException)
export class TestFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response: Response = host.switchToHttp().getResponse();
    response.status(exception.getStatus()).json({
      statusCode: exception.getStatus(),
      message: exception.getResponse(),
    });
  }
}
