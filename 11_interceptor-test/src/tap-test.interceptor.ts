import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AppService } from './app.service';
@Injectable()
export class TapTestInterceptor implements NestInterceptor {
  constructor(private appService: AppService) {}
  // Logger是NestJS内置的日志工具
  private readonly logger = new Logger(TapTestInterceptor.name);
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap((data) => {
        this.appService.getHello();
        this.logger.log(`log something`, data);
      }),
    );
  }
}
