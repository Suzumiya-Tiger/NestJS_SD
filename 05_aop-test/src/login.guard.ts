import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppService } from './app.service';

@Injectable()
export class LoginGuard implements CanActivate {
  @Inject(AppService)
  private appService: AppService;
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 获取class和handler的信息
    const controller = context.getClass();
    const handler = context.getHandler();
    console.log('controller', controller);
    console.log('handler', handler);
    console.log('login check', this.appService.getHello());

    return false;
  }
}
