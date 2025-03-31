# ExecutionContext:切换上下文

我们还是从创建一个filter过滤器入手:
```ts
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { AaaException } from './AaaException';

@Catch(AaaException)
export class AaaFilter implements ExceptionFilter {
  catch(exception: AaaException, host: ArgumentsHost) {
    console.log('expection', exception);
    console.log('host', host);
  }
}

```

创建一个expection供filter调用:
```ts
export class AaaException {
  constructor(
    public aaa: string,
    public bbb: string,
  ) {}
}

```

## 在controller自定义Exception

### 1. 为什么要自定义 Exception？

1. 更精确的错误处理

- 可以定义特定业务场景的错误类型

- 便于区分不同类型的错误

- 可以携带特定的错误信息和数据

1. 更好的代码可维护性

- 通过异常名称就能明确错误类型

- 便于统一处理特定类型的错误

- 提高代码的可读性

1. 统一的错误处理机制

- 可以为特定异常定制专门的处理逻辑

- 便于统一错误返回格式

- 方便进行错误日志记录

### 2. 实际应用示例

```typescript
// 1. 定义不同类型的自定义异常
export class UserNotFoundException extends Error {
  constructor(
    public userId: string,
    public message: string = `User ${userId} not found`
  ) {
    super(message);
    this.name = 'UserNotFoundException';
  }
}

export class InvalidPasswordException extends Error {
  constructor(
    public message: string = 'Invalid password provided'
  ) {
    super(message);
    this.name = 'InvalidPasswordException';
  }
}

// 2. 在业务逻辑中使用
class UserService {
  async findUser(id: string) {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new UserNotFoundException(id);
    }
    return user;
  }

  async login(username: string, password: string) {
    const user = await this.findUser(username);
    if (!this.validatePassword(password)) {
      throw new InvalidPasswordException();
    }
    return user;
  }
}

// 3. 异常过滤器处理不同类型的异常
@Catch(UserNotFoundException, InvalidPasswordException)
export class UserExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
     // Nest.js 会自动将捕获的异常注入到这里
    // exception 参数会是 UserNotFoundException 或 InvalidPasswordException 的实例
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    
    let status = 500;
    let message = 'Internal server error';
    
    if (exception instanceof UserNotFoundException) {
      status = 404;
      message = exception.message;
    } else if (exception instanceof InvalidPasswordException) {
      status = 401;
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

Nest.js 在UserExceptionFilter的异常处理机制：

- Nest.js 检测到抛出的异常

- 查找可以处理这个异常的过滤器

- 通过 @Catch() 装饰器确定哪个过滤器可以处理这个异常类型

- 自动将异常实例注入到对应过滤器的 catch 方法中

@Catch() 的灵活性：

```ts
// 基础异常类
export class BaseException extends Error {
  constructor(message: string) {
    super(message);
  }
}

// 派生异常类
export class UserException extends BaseException {
  constructor(message: string) {
    super(message);
  }
}

// 如果使用 @Catch(BaseException)，会捕获 BaseException 及其所有子类
```



### 3. 自定义异常的好处

1. 错误分类更清晰

```javascript
// 可以根据业务领域定义不同的异常
export class OrderException extends Error {
  constructor(
    public orderId: string,
    public errorCode: string,
    message: string
  ) {
    super(message);
    this.name = 'OrderException';
  }
}

export class PaymentException extends Error {
  constructor(
    public transactionId: string,
    public amount: number,
    message: string
  ) {
    super(message);
    this.name = 'PaymentException';
  }
}
```

2. 错误处理更精确

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof OrderException) {
      // 处理订单相关错误
      response.status(400).json({
        type: 'ORDER_ERROR',
        orderId: exception.orderId,
        code: exception.errorCode,
        message: exception.message
      });
    } else if (exception instanceof PaymentException) {
      // 处理支付相关错误
      response.status(402).json({
        type: 'PAYMENT_ERROR',
        transactionId: exception.transactionId,
        amount: exception.amount,
        message: exception.message
      });
    }
  }
}
```

3. 便于错误追踪和日志记录

```typescript
@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
  constructor(private logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof UserNotFoundException) {
      this.logger.warn(`User not found: ${exception.userId}`);
    } else if (exception instanceof PaymentException) {
      this.logger.error(`Payment failed for transaction: ${exception.transactionId}`);
    }
    // 继续向上抛出异常
    throw exception;
  }
}
```



## host方法介绍

```javascript
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { AaaException } from './AaaException';

@Catch(AaaException)
export class AaaFilter implements ExceptionFilter {
  catch(exception: AaaException, host: ArgumentsHost) {
  host;
  }
}

```

调用host.switchToHttp()方法会有以下子属性供选择:

![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2cc5c684064b433db5786b18c9d31841~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

我们需要先调用switchToHttp切换到http上下文，然后再调用getRequest,getResponse方法。

如果是 websocket、基于 tcp 的微服务等上下文，就分别调用 host.swtichToWs、host.switchToRpc 方法。

这样，就可以在 filter 里处理多个上下文的逻辑，跨上下文复用 filter了。



在controller里面，host用于切换http,websocket,rpc等上下文类型的，可以根据上下文类型获取到对应的argument，让Exception Filter等在不同的上下文中复用。





## 在Guard中自定义ExecutionContext



![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6037df49c67f4984bcb038a2a7d91cb4~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

没错，ExecutionContext 是 ArgumentHost 的子类，扩展了 getClass、getHandler 方法。

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/70d4b54f55ec4bc188324284367baa79~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=758&h=492&s=47151&e=png&b=ffffff)

可以通过调试来打印context.getClass()和context.getHandler()看下他们具体是啥:
![image-20250320232050639](/Users/heinrichhu/前端项目/NestJS_SD/08_argument-host/assets/image-20250320232050639.png)



会发现这俩货分别是controller和里面的handler。

为什么ExcutionContext里面需要拿到目标class和handler呢？

因为Guard、Interceptor的逻辑就是需要根据目标class、handler有没有某些装饰器来决定如何处理。

```typescript
export enum Role {
  Admin = 'admin',
  User = 'user',
}

```



```javascript
import { SetMetadata } from '@nestjs/common';
import { Role } from './role';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

```



在controller里面定义这个@Roles自定义decorator，然后我们就可以在@UseGuard去使用这个注入的具体的Role的枚举类型:

```typescript
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseFilters(AaaFilter)
  @UseGuards(AaaGuard)
  @Roles(Role.Admin)
  getHello(): string {
    throw new AaaException('aaa', 'bbb');
    return this.appService.getHello();
  }
}

```

然后我们就在Guard里面大显神通了:
```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Role } from './role';

@Injectable()
export class AaaGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return (
      requiredRoles.some(
        (role) => user && (user as { roles?: Role[] }).roles?.includes(role),
      ) || false
    );
  }
}

```



这里就是通过context(需要定义ExecutionContext)的getHandler方法先拿到目标handler的方法。
再通过reflector的api来拿到它的metaData。

判定有没有获取到对应的角色，如果没有就说明无需验证，跳过。

如果有那就要获取权限，从user的roles中判断下当前有没有比对下有没有dangqianrole，有的话就可以放行了。

```javascript
    const { user } = context.switchToHttp().getRequest();
```

在 NestJS 中，用户认证通常使用 @nestjs/passport 和 passport-jwt 等策略。当用户登录后，**Passport 会解析请求中的 JWT 并将用户信息存入 request.user**。

假设你在 auth.module.ts 里使用了 passport-jwt：

```javascript
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'your_secret_key', // 你的 JWT 密钥
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, roles: payload.roles }; // 这里返回的对象会被放入 `request.user`
  }
}
```

在 AuthGuard 执行 validate() 之后，request.user 就会被填充：

```javascript
const { user } = context.switchToHttp().getRequest();
console.log(user); // { userId: 123, roles: ['admin'] }
```



# 总结

为了让 Filter、Guard、Exception Filter 支持 http、ws、rpc 等场景下复用，Nest 设计了 ArgumentHost 和 ExecutionContext 类。

ArgumentHost 可以通过 getArgs 或者 getArgByIndex 拿到上下文参数，比如 request、response、next 等。

更推荐的方式是根据 getType 的结果分别 switchToHttp、switchToWs、swtichToRpc，然后再取对应的 argument。

而 ExecutionContext 还提供 getClass、getHandler 方法，可以结合 reflector 来取出其中的 metadata。

在写 Filter、Guard、Exception Filter 的时候，是需要用到这些 api 的。



































