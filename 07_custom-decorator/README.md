# 自定义装饰器

这一章再次回顾一下setMetadata的作用，具体在存储和获取上面。

首先setMetadata主要用于存储元数据，这些元数据不参与代码的执行。但是会做为拦截器的参数进行应用，比如在Guard中应用:

1. 元数据的存储机制

- SetMetadata 实际上是将数据存储在目标（方法或类）的元数据中

- 这些元数据是附加在装饰的目标上的，但并不会直接参与代码执行

2. 装饰器执行时机

- 装饰器是在代码定义时执行的，而不是在运行时

- 它们主要用于声明式的配置和标记，而不是直接的运行时逻辑

3. Guard 的角色

- Guard 是在请求处理过程中实际执行的地方

- 它可以访问完整的执行上下文（ExecutionContext）

- 通过 Reflector，Guard 可以读取之前由装饰器设置的元数据

举个例子，在您的代码中：

```javascript
export const Aaa = (...args: string[]) => SetMetadata('aaa', args);
```

这个装饰器仅仅是存储了一些数据，而：

```javascript
@Injectable()
export class AaaGuard implements CanActivate {
  @Inject(Reflector)
  private readonly reflector: Reflector;

  canActivate(context: ExecutionContext) {
    console.log('AaaGuard', this.reflector.get('aaa', context.getHandler()));
    return true;
  }
}
```

存储操作:

aaa.controller.ts

```TS
import { Controller, Get, SetMetadata, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AaaGuard } from './aaa.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @SetMetadata('aaa', 'admin')
  @UseGuards(AaaGuard)
  getHello(): string {
    return this.appService.getHello();
  }
}

```

但是这是setMetadata最初始的使用场景了，我们可以考虑直接引入返回SetMetadata的函数名，将其作为一个装饰器直接给控制器进行装饰:
```ts
import { Controller, Get, SetMetadata, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AaaGuard } from './aaa.guard';
import { Aaa } from './aaa.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  // @SetMetadata('aaa', 'admin')
  @Aaa('admin')
  @UseGuards(AaaGuard)
  getHello(): string {
    return this.appService.getHello();
  }
}

```

如果你想整合多个装饰器到一个装饰器里面，那么你可以考虑直接整合集请求类型、守卫、setMetadata三者于一体的自定义decorators:

这里可以使用applyDecorators整合所有的装饰器，作为一个函数来整合这些装饰器。

```javascript
import { applyDecorators, Get, UseGuards } from '@nestjs/common';
import { AaaGuard } from 'src/aaa.guard';
import { Aaa } from './aaa.decorator';
export function Bbb(path: string, role: string) {
  return applyDecorators(Get(path), Aaa(role), UseGuards(AaaGuard));
}

```

当然你自己也可以定义一个纯自定义装饰器，注意这里应该使用createParamDecorator:

```javascript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Ccc = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    return 'ccc';
  },
);

```

data 很明显就是传入的参数，而 ExecutionContext 前面用过，可以取出 request、response 对象。

```javascript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const MyHeaders = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    return key ? request.headers[key.toLowerCase()] : request.headers;
  },
);

```

通过 ExecutionContext 取出 request 对象，然后调用 getHeader 方法取到 key 对应的请求头返回。



Query装饰器也是一样的道理，我们可以通过创建自定义装饰器来提取query的参数:

```JS
export const MyQuery = createParamDecorator(
    (key: string, ctx: ExecutionContext) => {
        const request: Request = ctx.switchToHttp().getRequest();
        return request.query[key];
    },
);

```



你甚至还可以用pipe来给Query参数添加校验:
```JS
  @Get('hello7')
  getHello7(
    @Query('aaa', new ParseIntPipe()) aaa: number,
    @MyQuery('bbb', new ParseIntPipe()) bbb: number,
  ) {
    console.log('aaa', aaa);
    console.log('bbb', bbb);

    return aaa + bbb;
  }
```



也可以通过 applyDecorators 组合多个装饰器：

```javascript
import { applyDecorators, Controller, SetMetadata } from '@nestjs/common';

export const GetClassCto = (path, metadata) => {
  return applyDecorators(Controller(path), SetMetadata('metadata', metadata));
};

```

懒得演示了，具体看代码，注意这里改变了控制器的路径。























