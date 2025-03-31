import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class AaaGuard implements CanActivate {
  @Inject(Reflector)
  private readonly reflector: Reflector;

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log('AaaGuard', this.reflector.get('metadata', context.getClass()));

    console.log('AaaGuard', this.reflector.get('aaa', context.getHandler()));

    return true;
  }
}
