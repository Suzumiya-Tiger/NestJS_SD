import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuardGuard implements CanActivate {
  @Inject(Reflector)
  private readonly reflector: Reflector;
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const classMetadata = this.reflector.get<string[]>(
      'roles',
      context.getClass(),
    );
    const handlerMetadata = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    // console.log('request', request);
    console.log('classMetadata', classMetadata);
    console.log('handlerMetadata', handlerMetadata);

    return true;
  }
}
