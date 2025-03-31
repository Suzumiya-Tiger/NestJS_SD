# RxJS和Interceptor

## 什么是rxjs？

RxJS（Reactive Extensions for JavaScript）是**一个用于处理异步数据流的库**。



想象一下，你在河边钓鱼，水流（数据流）会不断带来鱼（数据），你可以选择**观察**（订阅 subscribe()）、**过滤**（filter()）、**转换**（map()）或者**合并**多个水流（merge()）。



**RxJS 主要作用**

​	•	**处理异步数据**（如 API 请求、用户输入、WebSocket 事件等）

​	•	**避免回调地狱**（比 Promise 更强大）

​	•	**提供丰富的操作符**（类似数组的方法，但适用于数据流）



**简单示例**

```typescript
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

// 创建一个数据流
const data$ = of(1, 2, 3, 4, 5);

// 处理数据流（将所有数据 *2）
data$.pipe(
  map(value => value * 2)
).subscribe(result => console.log(result)); 
// 输出: 2, 4, 6, 8, 10
```

**总结**：

​	•	of(1,2,3,4,5) 就像创建了一条水流

​	•	map(value => value * 2) 就像对水流中的每条鱼加工

​	•	subscribe() 就是拿到处理好的鱼（数据）



**RxJS 适用于：**

✅ **前端（Angular / React）**

✅ **后端（Node.js 事件流）**

✅ **WebSocket 实时数据**

✅ **防抖、节流、数据流合并**



🚀 **一句话：RxJS 让你更优雅地处理异步数据流！**



# RxJS在NestJS中的应用

**1. next.handle() 的作用**



next.handle() 在 NestInterceptor 中用于执行**下一个处理流程**，它返回的是 Observable<any>，即 **一个可观察的数据流**。



在 NestJS 中：

​	•	**next.handle() 相当于执行被拦截的控制器方法，并返回数据流（Observable）**。

​	•	next.handle() 的返回值是 Observable<T>，其中 T 是控制器返回的数据类型。



------



**2. pipe() 是什么？**



pipe() 是 RxJS **用于操作数据流的核心方法**。它允许我们在 Observable 里**添加操作符（Operators）**，如：

​	•	**map()**：修改数据

​	•	**tap()**：执行副作用（日志、调试）

​	•	**filter()**：过滤数据

​	•	**catchError()**：错误处理



**3. 为什么 RxJS 采用 pipe() 这种方式？**

**RxJS 采用 pipe() 是因为它的核心设计是**：**基于流的组合式操作**，可以让数据经过多个处理步骤，而不会影响原始数据流。

### RxJS在NestJS中的作用

✅ **数据流式处理**：可以在数据到达前进行多步操作（如日志、转换、过滤）。

在 RxJS 中，数据是**流式的（stream-based）**，而不是一次性传递的。

这意味着你可以在**数据真正到达订阅者之前**，对其进行**多个处理步骤**，比如：

​	•	**日志记录（tap()）**

​	•	**数据转换（map()）**

​	•	**数据过滤（filter()）**

假设你有一个 API 返回 Observable<number>，它会返回一系列数字：

```typescript
import { of } from 'rxjs';
import { map, tap, filter } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(
  tap((num) => console.log(`原始数据: ${num}`)),  // 记录日志
  filter((num) => num % 2 !== 0),  // 过滤掉偶数
  map((num) => num * 10)  // 乘以 10
).subscribe((result) => console.log(`最终数据: ${result}`));
```

**执行流程**

```tcl
原始数据: 1  ✅ 通过 tap 记录日志
最终数据: 10  ✅ 通过 filter 允许奇数，并乘以 10

原始数据: 2  ✅ 通过 tap 记录日志
（被 filter 过滤掉，不再处理）

原始数据: 3  ✅ 通过 tap 记录日志
最终数据: 30  ✅ 通过 filter 允许奇数，并乘以 10

原始数据: 4  ✅ 通过 tap 记录日志
（被 filter 过滤掉，不再处理）

原始数据: 5  ✅ 通过 tap 记录日志
最终数据: 50  ✅ 通过 filter 允许奇数，并乘以 10
```

**总结**

​	•	**在数据到达最终订阅者之前，数据已经经过了多个处理步骤（日志、过滤、转换）。**

​	•	**控制器最终只会收到已经被处理过的数据。**

​	•	**这种方式比传统的回调处理更加清晰，逻辑分离，易于维护。**



✅ **懒执行**：只有 subscribe() 触发时，pipe() 里的操作才会执行，提高性能。

​	•	**RxJS 的 Observable 是懒执行的**，它只有在 subscribe() 之后才会真正开始执行数据流。

​	•	**如果没有 subscribe()，即使定义了 pipe()，数据流也不会执行**，这样可以提高性能，避免不必要的计算。

```typescript
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

const obs$ = of(1, 2, 3).pipe(
  map((num) => {
    console.log(`转换数据: ${num} -> ${num * 2}`);
    return num * 2;
  })
);

// 这里还没有 subscribe，所以 map() 里的代码不会执行

console.log("还没订阅，Observable 还不会执行！");

// 直到这里 subscribe 之后，才开始执行数据流
obs$.subscribe((result) => console.log(`接收到数据: ${result}`));
```

**执行流程**

```typescript
还没订阅，Observable 还不会执行！  ✅ 说明 Observable 是懒执行的

转换数据: 1 -> 2  ✅ 订阅之后才执行
接收到数据: 2

转换数据: 2 -> 4  ✅ 订阅之后才执行
接收到数据: 4

转换数据: 3 -> 6  ✅ 订阅之后才执行
接收到数据: 6
```

**总结**

​	•	**Observable 只有在 subscribe() 时才真正开始执行**，不会像 Promise 那样立即执行，**避免了不必要的计算，提高性能**。

​	•	**如果没人订阅，数据流就不会触发**，所以 pipe() 里的操作也不会执行。



✅ **可组合性**：多个 pipe() 操作可以**链式组合**，而不用嵌套回调（避免回调地狱）。

**传统的嵌套回调（回调地狱）**

假设你需要：

1. **从 API 获取用户 ID**

2. **根据用户 ID 获取用户数据**

3. **从用户数据中获取订单信息**

	4.	**对订单进行转换**

```typescript
fetchUserId((userId) => {
  fetchUserData(userId, (userData) => {
    fetchOrders(userData, (orders) => {
      processOrders(orders, (processedOrders) => {
        console.log(processedOrders);
      });
    });
  });
});
```

​	•	**嵌套非常深，不易维护**

​	•	**每个回调都依赖上一个回调**

------



**RxJS 方式**

```typescript
import { of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

const fetchUserId = of(1);  // 模拟获取用户 ID
const fetchUserData = (id: number) => of({ id, name: "Alice" });
const fetchOrders = (user: any) => of([{ orderId: 123, amount: 99.99 }]);

fetchUserId.pipe(
  switchMap((userId) => fetchUserData(userId)),  // 获取用户数据
  switchMap((userData) => fetchOrders(userData)),  // 获取订单信息
  map((orders) => orders.map(order => ({ ...order, status: "Processed" }))) // 处理订单
).subscribe((processedOrders) => console.log(processedOrders));
```

**执行流程**

```typescript
[{ orderId: 123, amount: 99.99, status: "Processed" }]
```

**为什么 RxJS 方式更好？**



✅ **没有嵌套，所有操作都是链式组合，代码更清晰。**

✅ **每个 pipe() 里的操作都单独处理一部分逻辑，职责单一，易于维护。**

✅ **如果某一步出错，你可以轻松在 catchError() 里处理，而不会影响整个流程。**



## 应用方式

```typescript
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class AaaInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        console.log(`After...${Date.now() - now}ms`);
      }),
    );
  }
}

```

**Tap operator不会改变数据，只会额外执行一段逻辑。**

在handler 上启动interceptor:



```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { AaaInterceptor } from './aaa.interceptor';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseInterceptors(AaaInterceptor)
  getHello(): string {
    return this.appService.getHello();
  }
}

```

或者在全局启用:
![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/13609d5a22d346f08ac3844c3dbe1395~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

当然依旧是老生常谈的问题:
路由级别允许注入依赖，但是全局级别的interceptor是无法注入依赖的。



```typescript
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AppService } from './app.service';

@Injectable()
export class AaaInterceptor implements NestInterceptor {
  constructor(private appService: AppService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log(this.appService.getHello());
    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        console.log(`After...${Date.now() - now}ms`);
      }),
    );
  }
}

```

适合在nest的interceptor里面用的operator真的很少，而且固定使用的套路都是`next.handle().pipe(xxx)`，主要使用的就以下几个:



## map



```typescript
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

```

### typescript讲解

**1. MapTestInterceptor<T> 的泛型定义**

```typescript
export class MapTestInterceptor<T> implements NestInterceptor<T, Response<T>> 
```

这里 <T, Response<T>> 代表的是**泛型参数**，用于描述拦截器的输入输出类型。



根据 NestInterceptor 的定义：

```typescript
interface NestInterceptor<T = any, R = any> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<R>;
}
```

​	•	T：表示**控制器原本返回的数据类型**。

​	•	R（即 Response<T>）：表示**拦截器最终返回的数据类型**。

​	•	intercept() **必须返回 Observable<R>**，即 Observable<Response<T>>。



**那么，MapTestInterceptor<T> 的作用是什么？**

​	•	T 代表 **拦截前的返回值类型**（原始数据）。

​	•	Response<T> 代表 **拦截后的返回值类型**（格式化后的数据）。

​	•	**但 intercept() 方法的实际返回值是 Observable<Response<T>>**，因为它处理的是异步流。

**2. T 和 Response<T> 在 intercept() 里的作用**

```typescript
intercept(
  context: ExecutionContext,
  next: CallHandler<T>, // 控制器原始返回类型 T
): Observable<Response<T>> {  // 拦截器最终返回值 Observable<Response<T>>
  return next.handle().pipe(
    map((data: T) => {  // 这里的 data 是 T 类型
      return {
        code: 200,
        message: 'success',
        data,
      };
    }),
  );
}
```

**分析泛型的传递**

​	1.	**控制器原始返回类型** → T

```typescript
@Get()
getUser(): User {
  return { id: 1, name: 'Alice' };
}
```

​	•	这里 getUser() 方法的返回类型是 User，所以 T = User。

​	•	next.handle() 处理的是 Observable<T>，即 Observable<User>。

​	2.	**拦截器如何处理 T**

​	•	next.handle() 返回 Observable<T>（即 Observable<User>）。

​	•	.pipe(map((data: T) => {...})) 处理 T，将 T **转换** 成 Response<T>。

​	•	**最终返回 Observable<Response<T>>**，即 Observable<{ code: 200, message: 'success', data: User }>。



------



**3. Response<T> 和 Observable<Response<T>> 的关系**

🚀 **Response<T> 只是 Observable<Response<T>> 内部的数据结构，而 Observable<Response<T>> 是数据流。**

可以把 **Observable<Response<T>>** 想象成 **一个快递的运输过程** 🚚：

​	•	Response<T> 是快递包裹 📦。

​	•	Observable<Response<T>> 是快递运输的过程 🚛。

​	•	**NestJS 会自动“签收”这个快递**，然后把 Response<T> 交给前端（HTTP 响应）。

```typescript
const response: Response<User> = {
  code: 200,
  message: 'success',
  data: { id: 1, name: 'Alice' }
}; // 这是静态数据

const observableResponse: Observable<Response<User>> = of(response); // 这是数据流
```



在 intercept() 方法中：

​	•	map() 把 T 转换成 Response<T>。

​	•	但 intercept() **不能直接返回 Response<T>，必须返回 Observable<Response<T>>**。



------



**4. 直观理解**



可以把 Response<T> 和 Observable<Response<T>> 想象成 **河流和水里的鱼**：

​	•	Response<T> = **一条鱼** 🐟（静态数据）。

​	•	Observable<Response<T>> = **流动的河水，带着很多鱼** 🌊（数据流）。



intercept() **必须返回整个河流**，而不是直接扔一条鱼上去！



------



**5. 关键总结**



✅ **T 代表控制器原始返回数据**（如 User）。

✅ **Response<T> 代表拦截器最终返回的数据结构**（{ code, message, data }）。

✅ **intercept() 方法的最终返回值是 Observable<Response<T>>**，因为 NestJS 需要流式数据处理。

✅ **Response<T> 只是 Observable<Response<T>> 内部的数据，而不是 intercept() 直接返回的内容！**



------



🚀 **最终结论：**

​	•	Response<T> **不是 MapTestInterceptor 的返回值**，它只是一个**数据结构,而是用于辅助 Observable<Response<T>> 确定其数据类型的**。

​	•	intercept() **必须返回 Observable<Response<T>>，因为它处理的是数据流**。



### 实际应用

```typescript
  @Get('aaa')
  @UseInterceptors(MapTestInterceptor)
  getAaa(): string {
    return this.appService.getHello();
  }
```

​	•	next.handle() 会执行原始的 getAaa() 方法，获取 Observable<T>（即 Observable<string>）。

​	•	map((data: T) => {...}) 将原始数据 T（string）包装成 { code, message, data } 结构。

​	•	最终返回 Observable<Response<T>>，即：

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/47a71b3069394bf49aecc524731ba47f~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

你看到的 {"code":200,"message":"success","data":"Hello World!"} 确实是 Response<T> 的格式，而不是 Observable<Response<T>>，但它们之间的关系是：

> **Observable<Response<T>> 是一个数据流，而 NestJS 会自动** **订阅（subscribe）** **这个 Observable，并取出最终的数据**。



**1. NestJS 如何处理 Observable<Response<T>>**

在 intercept() 方法里：

```typescript
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
```

**流程解析**：

1. next.handle() 返回的是 Observable<T>，控制器返回的 T 可能是 "Hello World!"。

2. map((data: T) => {...}) 把 T 转换成 Response<T>，即 { code: 200, message: 'success', data: "Hello World!" }。

	3.	**最终返回的是 Observable<Response<T>>**，但你在浏览器看到的是**普通的 JSON 数据**，为什么？



**2. Observable<Response<T>> 是如何变成 JSON 的？**

**NestJS 会自动订阅（subscribe）这个 Observable**，并获取其中的数据！

在 main.ts 里，NestJS 的默认行为：

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
```

**在 HTTP 处理链的最后，NestJS 会自动 subscribe() 你的 Observable**，然后：

​	•获取 Response<T> 的最终值。

​	•将它作为 HTTP 响应返回给前端（转换为 JSON）。

你可以自己手动 subscribe() 观察：

```typescript
const observable = of({ code: 200, message: 'success', data: "Hello World!" });
observable.subscribe(result => console.log(result)); 
// 输出：{ code: 200, message: 'success', data: 'Hello World!' }
```

这就是为什么你在浏览器最终看到的是 JSON 数据，而不是 Observable<Response<T>>。

**关键总结**



✅ 你返回的是 **Observable<Response<T>>**，但 NestJS **会自动订阅它并取出 Response<T> 作为 HTTP 响应**。

✅ 你在浏览器看到的是最终的数据（Response<T>），而不是 Observable。

✅ Observable 只是数据流的容器，NestJS **会帮你执行 .subscribe()，获取最终结果**。



🚀 **最终结论：你返回的确实是 Observable<Response<T>>，但 NestJS 自动处理了订阅，所以最终看到的是 Response<T>！**





## tap

```typescript
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

```

在app.controller.ts中应用:

```ts
  @Get('bbb')
  @UseInterceptors(TapTestInterceptor)
  getBbb(): string {
    return this.appService.getHello();
  }
```

**Logger 是 NestJS 内置的日志工具**

​	•	Logger 是 NestJS 提供的**日志记录类**，可以输出 log、warn、error、debug 等日志信息。

​	•	new Logger(TapTestInterceptor.name) 这里的 TapTestInterceptor.name 代表当前类的名称 "TapTestInterceptor"，这样日志输出时会**自动带上类名**，方便调试。

## catchError

controller 里很可能会抛出错误，这些错误会被 exception filter 处理，返回不同的响应，但在那之前，我们可以在 interceptor 里先处理下。

```typescript
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { Logger } from '@nestjs/common';
interface ErrorResponse {
  code: number;
  message: string;
  stack?: any;
}
@Injectable()
export class CatchErrorTestInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CatchErrorTestInterceptor.name);
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err: ErrorResponse) => {
        this.logger.error(err.message, err.stack);
        return throwError(() => err);
      }),
    );
  }
}

```

实际应用:

```typescript
  @Get('ccc')
  @UseInterceptors(CatchErrorTestInterceptor)
  getCcc(): string {
    throw new Error('xxx');
    return this.appService.getHello();
  }
```



![image-20250325233052029](/Users/heinrichhu/前端项目/NestJS_SD/11_interceptor-test/assets/image-20250325233052029.png)



对应的500报错连续打印了两次，一次是我们自定义的interceptor打印的，一次是nest内置的exception filter默认的打印行为。



## timeout

我们如果想给用户一个接口超时的响应，可以考虑使用timeout operator:

```typescript
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import {
  catchError,
  Observable,
  throwError,
  timeout,
  TimeoutError,
} from 'rxjs';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(3000),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          throw new RequestTimeoutException();
        }
        return throwError(() => err);
      }),
    );
  }
}

```

timeout这个操作符会在接口请求超出3s都没收到消息的时候，自动抛出一个TimeoutError。

然后用catchError操作符处理以后，如果是TimeoutError类型的报错，那么就抛出超时类型的错误RequestTimeoutException，这个有内置的exception filter会处理为对应的响应格式。

```typescript
  @Get('ddd')
  @UseInterceptors(TimeoutInterceptor)
  async getDdd(): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 4000));
    return 'ddd';
  }
```

![image-20250325234529863](/Users/heinrichhu/前端项目/NestJS_SD/11_interceptor-test/assets/image-20250325234529863.png)

切记这个返回的 `new RequestTimeoutException`是nest内置的exception filter处理后返回上图的报错数据。

catchError是interceptor用于处理报错用的rxjs提供的catch函数。



## 全局interceptor

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AaaInterceptor } from './aaa.interceptor';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new AaaInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

```

AaaInterceptor是依赖于AppService的，但是全局注入不支持注入依赖，我们可以通过nest提供的token在appmodule里面声明interceptor，这里nest会把它作为全局inteceptor:
```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AaaInterceptor } from './aaa.interceptor';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AaaInterceptor,
    },
  ],
})
export class AppModule {}

```

这意味着我们无需在main.ts中加载有依赖注入的interceptor，而是直接在app.module利用APP_INTERCEPTOR做provide的声明属性，然后任意一个请求都会响应对应的interceptor的拦截处理:
![image-20250325235338771](/Users/heinrichhu/前端项目/NestJS_SD/11_interceptor-test/assets/image-20250325235338771.png)

![image-20250325235357706](/Users/heinrichhu/前端项目/NestJS_SD/11_interceptor-test/assets/image-20250325235357706.png)





# 总结

rxjs 是一个处理异步逻辑的库，它的特点就是 operator 多，你可以通过组合 operator 来完成逻辑，不需要自己写。

nest 的 interceptor 就用了 rxjs 来处理响应，但常用的 operator 也就这么几个：

- tap: 不修改响应数据，执行一些额外逻辑，比如记录日志、更新缓存等
- map：对响应数据做修改，一般都是改成 {code, data, message} 的格式
- catchError：在 exception filter 之前处理抛出的异常，可以记录或者抛出别的异常
- timeout：处理响应超时的情况，抛出一个 TimeoutError，配合 catchErrror 可以返回超时的响应

总之，rxjs 的 operator 多，但是适合在 nest interceptor 里用的也不多。

此外，interceptor 也是可以注入依赖的，你可以通过注入模块内的各种 provider。

全局 interceptor 可以通过 APP_INTERCEPTOR 的 token 声明，这种能注入依赖，比 app.useGlobalInterceptors 更好。

interceptor 是 nest 必用功能，还是要好好掌握的。
