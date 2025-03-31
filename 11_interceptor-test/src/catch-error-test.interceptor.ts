import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { Logger } from '@nestjs/common';
interface ErrorResponse {
  code: number;
  message: string;
  stack?: any;
}
@Injectable()
export class CatchErrorTestInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CatchErrorTestInterceptor.name);
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err: ErrorResponse) => {
        this.logger.error(err.message, err.stack);
        return throwError(() => err);
      }),
    );
  }
}
