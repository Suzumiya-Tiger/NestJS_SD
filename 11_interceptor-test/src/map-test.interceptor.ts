import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

interface Response<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable()
export class MapTestInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data: T) => {
        return {
          code: 200,
          message: 'success',
          data,
        };
      }),
    );
  }
}
