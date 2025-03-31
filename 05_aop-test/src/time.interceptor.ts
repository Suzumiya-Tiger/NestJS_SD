import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class TimeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    console.log('before interceptor', context.getClass(), context.getHandler());

    return next.handle().pipe(
      tap(() => {
        console.log('time', Date.now() - startTime);
      }),
    );
  }
}
