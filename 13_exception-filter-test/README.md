# 自定义Exception Filter

## 基本概念

```typescript
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch() // 捕获所有异常
export class HelloFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {}
}
```

### @Catch()

这是专用于ExceptionFilter的装饰器，用于指定它下面标记的类是一个异常过滤器。

默认情况下，它会捕获所有的异常类型。除非你在里面指定了参数，比如@Catch(HttpException)，这个时候它就会捕获HttpException。



### exception:T

exception是catch()方法的第一个参数，它代表了被捕获的异常，这里的泛型T可以指定任何类型的异常，比如:

- HttpException

- Error
- 自定义异常类

在 NestJS 中，exception 可能是：

​	•	**一个 Error 对象**（比如 new Error('Something went wrong')）。

​	•	**一个 HttpException**（NestJS 自带的 HTTP 异常）。

​	•	**一个普通的字符串、对象，甚至 null**（比如 throw 'Something went wrong'）。

​	•	**其他非标准的错误格式**。



### ArgumentsHost

这个参数用于请求当前请求的上下文，也就是请求的环境信息。

ArgumentsHost 允许我们获取不同类型的**执行上下文（Execution Context）**：

​	•	**host.getArgs()**：获取控制器方法的所有参数（如 req、res、next）。

​	•	**host.switchToHttp()**：获取 HTTP 请求的上下文，如 Express 的 Request 和 Response 对象。

​	•	**host.switchToRpc()**：获取 RPC（微服务）的上下文。

​	•	**host.switchToWs()**：获取 WebSocket 上下文。

```typescript
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { Response } from 'express';
@Catch(BadRequestException)
export class HelloFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    // 获取异常状态码
    const statusCode = exception.getStatus();

    response.status(statusCode).json({
      code: statusCode,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: http.getRequest().url,
    });
  }
}

```



## @UseFilter

```typescript
impo1rt {
  Controller,
  Get,
  HttpStatus,
  HttpException,
  UseFilters,
} from '@nestjs/common';
import { AppService } from './app.service';
import { HelloFilter } from './hello.filter';

@Controller()
@UseFilters(HelloFilter)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    throw new HttpException('xxxx', HttpStatus.BAD_REQUEST);
    return this.appService.getHello();
  }
}
```

以上代码中，不要认为 throw new HttpException('xxx',HttpStatus.BAD_REQUEST)和@UseFilters(HelloFilter)会重复，两者并不重复，下面针对handler的处理是指定了使用 HttpException和指定参数处理。

如果你没有指定@Catch(BadRequestException),那么这些都会被HelloFilter接收处理后，按照HelloFilter的方式返回:

```json
{
  "statusCode": 400,
  "message": "xxxx",
  "timestamp": "2025-03-27T12:34:56.789Z",
  "path": "/"
}
```

但是你这里明显指定了`@Catch(BadRequestException)`，这就导致了HelloFilter不会处理handler中抛出的HttpException异常，除非你去除@Catch()的传参并且定义exception为泛型T，或者指定HttpException。

```typescript
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
// ... existing code ...
@Catch(HttpException) // 改为捕获HttpException而不是BadRequestException
export class HelloFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    // 获取异常状态码
    const statusCode = exception.getStatus();

    response.status(statusCode).json({
      code: statusCode,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: http.getRequest().url,
    });
  }

  // ... existing code ...
}

```

当然最好还是使用泛型T，但是你必须要声明T继承于HttpException，才能更好地使用exception对应HttpException的一些方法和属性:

```TS
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response, Request } from 'express';
// ... existing code ...
@Catch()
export class HelloFilter<T extends HttpException> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    // 获取异常状态码
    const statusCode = exception.getStatus();

    response.status(statusCode).json({
      code: statusCode,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  // ... existing code ...
}

```

 **BadRequestExeption、BadGateWayException 等都是HttpException的子类**，这也是为什么推荐`extends HttpException`的原因。



## ValidationPipe的困境

Aaa.dto.ts

```typescript
import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class AaaDto {
  @IsNotEmpty({ message: 'aaa 不能为空' })
  @IsEmail({}, { message: 'aaa 不是邮箱格式' })
  aaa: string;

  @IsNumber({}, { message: 'bbb 不是数字' })
  @IsNotEmpty({ message: 'bbb 不能为空' })
  bbb: number;
}

```



```typescript
  @Post('aaa')
  aaa(@Body() aaaDto: AaaDto) {
    return 'success';
  }
```



![image-20250328000819919](/Users/heinrichhu/前端项目/NestJS_SD/13_exception-filter-test/assets/image-20250328000819919.png)



这里报错会变得非常奇怪，这并非是我们定义的exception filter的报错，为啥会这样呢？

当然是因为你自己定义了ValidationPipe直接导致和exception filter起了冲突。

 exception filter 会拦截所有 HttpException，但是没有对这种情况做支持。

我们在main.ts全局启用helloFilter,取消控制器里面的局部helloFilter。

debug一下看到exception里面的response实际上是遵循ValidationPipe的报错执行的:
![image-20250328001703416](/Users/heinrichhu/前端项目/NestJS_SD/13_exception-filter-test/assets/image-20250328001703416.png)

我们要针对性地识别exception中的response中的message是否存在，基于这个判断决定用什么样的返回信息，因为HttpException和ValidationPipe中的message重叠了，出现了冲突。

正是在处理这种差异：

- 如果res.message存在且有join方法（是数组），则把数组元素连接成一个字符串

- 如果不是数组，则使用exception.message（普通HttpException的消息）

您的观察完全正确：如果没有冲突（即不是ValidationPipe产生的错误），代码会默认使用HttpException自身的message属性，这通常是一个字符串。

您在过滤器中注入AppService并将其输出添加到响应中的做法很有趣，这展示了过滤器也可以访问应用的其他服务，这在某些特殊场景（如错误日志记录）中非常有用。

但是老实说我感觉这种方式并不优雅......

### 关于NestJS异常处理的现状

您说得对，NestJS确实没有提供一个完全统一的解决方案来无缝处理ValidationPipe和ExceptionFilter之间的错误格式。

当前的情况是：

1. ValidationPipe 产生的错误通常包含一个数组形式的message字段，主要用于表单验证错误

1. HttpException及其子类 (如BadRequestException)产生的错误通常有一个字符串形式的message

1. 自定义异常 可能有各种不同的结构

这种不一致性确实让开发者不得不编写额外的逻辑来处理这些差异，就像您当前的代码那样。

#### 为什么NestJS这样设计

NestJS这样设计是为了提供更大的灵活性，不同的错误类型有不同的使用场景：

- 验证错误通常需要返回多条信息给前端

- 业务逻辑异常可能只需要单一信息

- 有时你可能需要完全自定义异常响应



#### 可能的改进方向

虽然没有官方的统一解决方案，但您可以考虑以下方法来改进代码架构：

1. 创建自定义异常类：设计一个统一的异常结构，在应用中始终使用它

1. 自定义ValidationPipe：扩展ValidationPipe，使其抛出格式一致的错误

1. 采用拦截器模式：使用ResponseInterceptor统一所有响应格式，包括错误和成功响应

1. 制定异常处理策略：在团队中约定异常处理标准，创建一套辅助工具类

如果您想要一个更优雅的解决方案，可能需要构建一个小型框架层，位于NestJS之上，专门处理这些不一致性。

您认为在您的项目中，哪种方案更适合呢？需要考虑的是，过度的抽象有时也会带来额外的复杂性。





## 在filter中注入service的步骤

在app.module.ts中声明全局filter:
```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER } from '@nestjs/core';
import { HelloFilter } from './hello.filter';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HelloFilter,
    },
  ],
})
export class AppModule {}

```

这意味着你可以在全局任意filter中爽调注入依赖啦:

```TS
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AppService } from './app.service';
// ... existing code ...
@Catch()
export class HelloFilter<T extends HttpException> implements ExceptionFilter {
  @Inject(AppService)
  private readonly appService: AppService;
  catch(exception: T, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    // 获取异常状态码
    const statusCode = exception.getStatus();
    const res = exception.getResponse() as { message: string[] };
    response.status(statusCode).json({
      code: statusCode,
      message: res?.message?.join ? res.message.join(',') : exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
      appService: this.appService.getHello(),
    });
  }

  // ... existing code ...
}

```

![image-20250328002906938](/Users/heinrichhu/前端项目/NestJS_SD/13_exception-filter-test/assets/image-20250328002906938.png)

**如果 filter 要注入其他 provider，就要通过 AppModule 里注册一个 token 为 APP_FILTER 的 provider 的方式。**

**使用APP_FILTER这种方式有两个主要优点：**

1. 依赖注入支持：正如您所提到的，这种方式允许过滤器可以注入依赖项（如您在HelloFilter中注入的AppService）
2. 模块作用域：这种方式让过滤器在声明它的模块及其所有控制器中生效





## 自定义Exception

```typescript
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AppService } from './app.service';

export class UnloginException extends HttpException {
  constructor(message?: string) {
    super(message ?? '未登录', HttpStatus.UNAUTHORIZED);
  }
}

@Catch(UnloginException)
export class UnloginFilter implements ExceptionFilter {
  catch(exception: UnloginException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();

    response.status(HttpStatus.UNAUTHORIZED).json({
      code: HttpStatus.UNAUTHORIZED,
      message: exception.message,
    });
  }

  // ... existing code ...
}

```



```typescript
    {
      provide: APP_FILTER,
      useClass: UnloginFilter,
    },
```





```typescript

  @Get('bbb')
  bbb() {
    throw new UnloginException();
  }
```

