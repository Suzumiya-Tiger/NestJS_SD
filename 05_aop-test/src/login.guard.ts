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
    const request = context.switchToHttp().getRequest();
    // 获取class和handler的信息
    const controller = request.controller;
    const handler = request.handler;
    console.log('controller', controller);
    console.log('handler', handler);
    console.log('login check', this.appService.getHello());

    return false;
  }
}
