# Nest装饰器梳理

本章主要针对一些比较薄弱的知识点进行梳理，重点是装饰器部分:

# @SetMetadata 装饰器的深入解析

从您的代码中，我看到 @SetMetadata 在两个地方使用：类级别设置 'roles' 为 ['user']，方法级别设置为 ['admin']。这不是简单的标记，而是 NestJS 框架中的一个核心功能，用于实现声明式的授权和拦截控制。

## 基本原理和机制

@SetMetadata 是 NestJS 中的一个装饰器，用于将自定义元数据附加到路由处理程序或控制器类上。它实际上是通过 JavaScript 的 Reflection API (具体是 Reflect Metadata) 在背后实现的，允许您存储可以在运行时检索的元数据。

### 两个参数的含义

```typescript
@SetMetadata(key: string, value: any)
```

1. 第一个参数 key：元数据的键名，例如 'roles'，相当于一个命名空间或标识符

1. 第二个参数 value：与该键关联的值，在您的例子中是角色数组 ['user'] 或 ['admin']

## 实际应用场景

### 1. 权限控制系统

您的代码中最明显的用途是实现基于角色的访问控制 (RBAC)：

```typescript
@Controller()
@SetMetadata('roles', ['user'])  // 控制器级别：所有方法默认需要 'user' 角色
export class AppController {
  // ...
  
  @Get()
  @UseFilters(AaaFilter)
  @UseGuards(AaaGuard)           // 这个守卫可能会检查用户角色
  @UseInterceptors(AaaInterceptor)
  @SetMetadata('roles', ['admin'])  // 方法级别：覆盖为需要 'admin' 角色
  getHello(): string {
    // ...
  }
}
```

```tex
客户端请求 → NestJS 路由 → 认证守卫执行
  ↓
守卫通过 Reflector 读取附加在方法上的 'roles' 元数据 ['admin']
  ↓
守卫从请求中获取用户信息（通常从 JWT 令牌或会话中）
  ↓
守卫比较用户实际角色与方法要求的角色 ['admin']
  ↓
如果匹配 → 允许请求继续 → 执行控制器方法
如果不匹配 → 拒绝请求（通常返回 403 Forbidden）
```



### 2. 与守卫 (Guards) 配合使用

守卫是这个元数据最常用的消费者。我们在setMetadata里面设置对应的角色以后，需要在 @UseGuards(AaaGuard) 里面来提取目标controller的各类元数据:

```typescript
// 假设的 AaaGuard 实现
@Injectable()
export class AaaGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  
  canActivate(context: ExecutionContext): boolean {
    // 获取路由处理程序的元数据
    const methodRoles = this.reflector.get<string[]>('roles', context.getHandler());
    
    // 获取控制器的元数据
    const controllerRoles = this.reflector.get<string[]>('roles', context.getClass());
    
    // 合并或优先使用方法级别的角色
    const roles = methodRoles || controllerRoles;
    
    // 检查当前用户是否具有所需角色
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    return user && roles.some(role => user.roles.includes(role));
  }
}
```

简单来讲就是@SetMetadata('roles', ['admin']) 存储了admin数据，而guard则会通过或者获取到admin以做后面的校验操作。

### 3. 元数据的继承和覆盖机制

- 控制器级别的 @SetMetadata('roles', ['user']) 为所有方法设置默认值

- 方法级别的 @SetMetadata('roles', ['admin']) 覆盖特定方法的默认值

这允许您实现精细的访问控制策略：有些方法可能对普通用户开放，而其他方法仅限管理员访问。

## 高级用途

1. 自定义装饰器：通常会创建自定义装饰器来简化使用:

```typescript
// 创建自定义 @Roles 装饰器
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// 使用自定义装饰器
@Controller()
@Roles('user')
export class AppController {
  @Get()
  @Roles('admin')
  getHello() {}
}
```

2. 组合元数据：多个元数据键可以用于实现复杂的访问控制：

```typescript
@SetMetadata('roles', ['admin'])
@SetMetadata('permissions', ['read', 'write'])
@SetMetadata('rateLimit', { limit: 100, period: 60 })
```

3. 与拦截器配合：您的代码中使用了 @UseInterceptors(AaaInterceptor)，拦截器也可以读取元数据来修改请求或响应。

总结来说，@SetMetadata 是 NestJS 中实现声明式编程的强大工具，通过它可以将业务规则和限制条件直接附加到控制器和方法上，然后由守卫、拦截器等来执行这些规则



## 架构意义

@SetMetadata 的关键意义在于它实现了关注点分离：

1. 声明性配置：允许开发者以声明方式定义路由、控制器、或方法的属性和行为限制，而不需要在函数体内编写这些逻辑。

1. 元数据驱动架构：创建了一个"元数据层"，框架组件可以读取并基于这些元数据做出决策。

1. 抽象框架基础设施：使应用程序代码不必直接与框架的核心机制交互，而是通过声明性接口间接交互。

1. 运行时自省能力：让框架在运行时可以"询问"某个路由处理器："你需要什么角色才能访问？"，而不是将这种逻辑硬编码。

## 与传统方法的对比

相比于其他授权实现方式，@SetMetadata 的方法有本质区别：

传统方法（命令式）：

```typescript
function getHello() {
  // 直接在方法中检查权限
  if (!hasPermission(currentUser, 'admin')) {
    throw new UnauthorizedException();
  }
  // 业务逻辑...
}
```

使用 @SetMetadata（声明式）：

```typescript
@SetMetadata('roles', ['admin'])
function getHello() {
  // 只包含业务逻辑，权限检查被移出到守卫中
}
```

这种区别不仅是语法上的，而是反映了底层架构哲学的根本差异：将"什么"与"如何"分离。@SetMetadata 声明"什么"（需要什么权限），而守卫实现"如何"（如何检查权限）。

@SetMetadata 是 NestJS 中 IoC（控制反转）和 AOP（面向切面编程）架构的核心构建块：

1. 它使 NestJS 能够实现一个可扩展的、基于元数据的依赖注入系统

1. 它使框架能够在不改变业务代码的情况下注入横切关注点（如授权、日志、缓存）

1. 它是 NestJS 模块化设计的基石，让各种增强功能可以以插件方式添加

总之，@SetMetadata 的核心作用是创建一个元数据层，使框架能够以声明方式配置应用程序的行为，从而实现关注点分离和可扩展的架构设计。在您的代码中，它为基于角色的访问控制提供了声明式的配置机制，使得权限逻辑与业务逻辑完全分离。



# controller的一些自定义操作

## @Controller的传参

我们可以通过在不同的controller之中通过传参定义host或者path，来指定需要满足这些条件才可以允许访问:

```TS
import { Controller, Get, HostParam } from '@nestjs/common';

@Controller({ host: ':host.0.0.1', path: 'aaa' })
export class AaaController {
  @Get('bbb')
  hello(@HostParam('host') host: string) {
    return `hello ${host}`;
  }
}

```

在这里，host里面的参数可以通过@HostParam('host')来获取。

## 装饰器的核心作用

1. 参数来源的明确指定

​	在 HTTP 请求中，数据可能来自多个不同的位置：URL 参数、查询字符串、请求体、请求头、主机名等。如果没有装饰器，框架将无法知道参数应该从哪里获取。

2. 依赖注入系统的支持

​	NestJS 基于强大的依赖注入系统构建。装饰器告诉依赖注入容器："这个参数需要从请求的特定部分提取"。

3. 类型转换和验证

​	装饰器不仅提取数据，还可以与管道（Pipes）结合，执行类型转换和验证，如：

```typescript
   @Get(':id')
   findOne(@Param('id', ParseIntPipe) id: number) { ... }
```

4. 元数据驱动的框架

​	NestJS 是元数据驱动的，它使用 TypeScript 的装饰器特性在运行时存储和检索元数据，以实现路由、依赖注入、拦截等复杂功能。

通过使用 @HostParam('host') 等装饰器，NestJS 实现了：

1. 声明式编程：明确声明每个参数的来源，使代码自解释

2. 关注点分离：控制器方法只关注业务逻辑，参数提取由框架处理
3. 可扩展性：可以轻松添加自定义参数装饰器
4. 统一的参数处理管道：所有参数遵循相同的提取、验证和转换流程

总的来说，装饰器是现代 TypeScript 框架中实现声明式、类型安全和元数据驱动编程的关键工具。在 NestJS 中，它们不仅是语法糖，而是整个框架架构和依赖注入系统的基础。



## 装饰器中使用@Req

```typescript
  @Get('ccc')
  ccc(@Req() req: Request) {
    console.log(req.headers);
    console.log(req.body);
    return 'ccc';
  }

```

通过@Req()装饰器可以获取对应的请求相关参数:
![image-20250318144543997](D:\HeinrichHu\resource\NestJS_SD\06_all-decorator\README.assets\image-20250318144543997.png)



## 装饰器中使用next()

next()的调用理念和express相似，只需要在同样的路径中的前一条调用next()，就会继续执行到下一个同名路径中进行执行，没有next()才执行返回:

```typescript
  @Get('eee')
  eee(@Next() next: NextFunction) {
    console.log('ahndler1');
    next();

    return 'handler2';
  }

  @Get('eee')
  eee2() {
    console.log('handler2');
    return 'handler3';
  }
```





## 总结

这节我们梳理了下 Nest 全部的装饰器

- @Module： 声明 Nest 模块
- @Controller：声明模块里的 controller
- @Injectable：声明模块里可以注入的 provider
- @Inject：通过 token 手动指定注入的 provider，token 可以是 class 或者 string
- @Optional：声明注入的 provider 是可选的，可以为空
- @Global：声明全局模块
- @Catch：声明 exception filter 处理的 exception 类型
- @UseFilters：路由级别使用 exception filter
- @UsePipes：路由级别使用 pipe
- @UseInterceptors：路由级别使用 interceptor
- @SetMetadata：在 class 或者 handler 上添加 metadata
- @Get、@Post、@Put、@Delete、@Patch、@Options、@Head：声明 get、post、put、delete、patch、options、head 的请求方式
- @Param：取出 url 中的参数，比如 /aaa/:id 中的 id
- @Query: 取出 query 部分的参数，比如 /aaa?name=xx 中的 name
- @Body：取出请求 body，通过 dto class 来接收
- @Headers：取出某个或全部请求头
- @Session：取出 session 对象，需要启用 express-session 中间件
- @HostParm： 取出 host 里的参数
- @Req、@Request：注入 request 对象
- @Res、@Response：注入 response 对象，一旦注入了这个 Nest 就不会把返回值作为响应了，除非指定 passthrough 为true
- @Next：注入调用下一个 handler 的 next 方法
- @HttpCode： 修改响应的状态码
- @Header：修改响应头
- @Redirect：指定重定向的 url
- @Render：指定渲染用的模版引擎

把这些装饰器用熟，就掌握了 nest 大部分功能了。





# MetaData和Reflector

Reflect有以下API:
```TS
Reflect.defineMetadata(metadataKey, metadataValue, target);

Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);


let result = Reflect.getMetadata(metadataKey, target);

let result = Reflect.getMetadata(metadataKey, target, propertyKey);

```

Reflect.defineMetadata 和 Reflect.getMetadata 分别用于设置和获取某个类的元数据，如果最后传入了属性名，还可以单独为某个属性设置元数据。

那元数据存在哪呢？

存在类或者对象上呀，如果给类或者类的静态属性添加元数据，那就保存在类上，如果给实例属性添加元数据，那就保存在对象上，用类似 [[metadata]] 的 key 来存的。

## 封装Reflect.metadata装饰器

```typescript
function Type(type) {
    return Reflect.metadata("design:type", type);
}
function ParamTypes(...types) {
    return Reflect.metadata("design:paramtypes", types);
}
function ReturnType(type) {
    return Reflect.metadata("design:returntype", type);
}

@ParamTypes(String, Number)  // 标记构造函数的参数类型为 [String, Number]
class Guang {
  constructor(text, i) {
  }

  @Type(String)  // 标记 name 属性的类型为 String
  get name() { return "text"; }

  @Type(Function)  // 标记 add 方法的类型为 Function
  @ParamTypes(Number, Number)  // 标记参数类型为 [Number, Number]
  @ReturnType(Number)  // 标记返回类型为 Number
  add(x, y) {
    return x + y;
  }
}

```

这段代码展示了 TypeScript 中 Reflect Metadata API 的使用，这是实现装饰器和依赖注入等高级功能的基础技术。我来详细解释：

## 1. 装饰器函数定义

首先定义了三个装饰器函数：

- Type(type): 用于标记一个属性或方法的类型

- ParamTypes(...types): 用于标记参数的类型列表

- ReturnType(type): 用于标记返回值的类型

这些函数内部都使用 Reflect.metadata 来存储元数据。

## 2. 代码意义与应用场景

这段代码的重要意义在于：

1. 运行时类型信息：JavaScript 本身是动态类型的，运行时没有类型信息。这种机制让我们能在运行时获取到编译时的类型信息。

1. 框架基础设施：这正是许多现代框架如 NestJS、Angular 等实现依赖注入和其他高级功能的基础。

1. 实际应用示例：

- 依赖注入系统可以通过读取构造函数的参数类型来自动提供正确类型的依赖

- API框架可以基于方法的参数类型和返回类型进行自动验证

- ORM框架可以根据属性类型自动将数据库结果映射到对象

1. 与我们之前讨论的联系：这正是 NestJS 中 @HostParam、@SetMetadata 等装饰器的底层工作原理 - 它们都在使用元数据来存储和检索运行时需要的信息。

在实际开发中，通常不需要直接编写这样的代码，而是使用成熟框架提供的装饰器。但理解这一原理有助于我们更好地掌握这些框架的工作方式。

## Reflect.getMetadata 的作用详解

Reflect.getMetadata 是反射元数据 API 的核心方法，用于检索之前通过装饰器存储的元数据。让我结合前面的代码来解释它的作用：

### 基本工作原理

```typescript
class Guang {
  constructor(text, i) {
  }

  @Type(String)  // 标记 name 属性的类型为 String
  get name() { return "text"; }

  @Type(Function)  // 标记 add 方法的类型为 Function
  @ParamTypes(Number, Number)  // 标记参数类型为 [Number, Number]
  @ReturnType(Number)  // 标记返回类型为 Number
  add(x, y) {
    return x + y;
  }
}
```

1. 这些 @XXX() 就是装饰器，它们是在代码定义阶段自动执行的函数
2. 当 JavaScript 引擎看到这个类定义时，会自动执行这些装饰器函数
3. 所以 @ParamTypes(Number, Number) 在类定义时就会执行，而不是在调用 add 方法时

### 关于 "design:paramtypes"

`"design:paramtypes"` 这个键名并不是随意取的，而是 TypeScript 的约定：

1. 当你使用 Reflect.metadata 存储元数据时，需要一个键名来区分不同类型的元数据
2. design:paramtypes" 是用来存储"参数类型列表"的标准键名
3. 同样还有 "design:type" 和 "design:returntype" 等标准键名

### 简单类比

想象元数据系统就像一个大字典：

1. 每个对象和它的方法都可以附加这个"字典"

1. 装饰器 @ParamTypes(Number, Number) 做的事情就是：在 Guang 类的 add 方法的"字典"中写入一条信息：键为 "design:paramtypes"，值为 [Number, Number]

1. 然后 Reflect.getMetadata("design:paramtypes", obj, "add") 就是从这个"字典"中读取信息

### 实际工作流程

写入阶段：当类被定义时，装饰器执行并存储元数据

```typescript
   // 当解析到这个装饰器时自动执行
   @ParamTypes(Number, Number)  // 实际上执行了 Reflect.metadata("design:paramtypes", [Number, Number])
   add(x, y) { ... }
```

读取阶段：需要这些信息时，使用 Reflect.getMetadata 读取

```typescript
   let obj = new Guang("a", 1);
   // 读取之前存储的元数据
   let paramTypes = Reflect.getMetadata("design:paramtypes", obj, "add");
   // 得到 [Number, Number]
```





当您执行：

```typescript
let obj = new Guang("a", 1);
let paramTypes = Reflect.getMetadata("design:paramtypes", obj, "add"); 
// [Number, Number]
```

这段代码在做什么：

1. 检索元数据：从 obj 对象的 "add" 方法上获取键名为 "design:paramtypes" 的元数据

1. 返回值：返回之前通过 @ParamTypes(Number, Number) 装饰器存储的参数类型数组 [Number, Number]

### 参数解析

`Reflect.getMetadata(metadataKey, target, propertyKey?)` 接收三个参数：

1. metadataKey：要检索的元数据的键名（例如 "design:paramtypes"）

1. target：目标对象（例如 obj 实例）

1. propertyKey：（可选）目标对象上的特定属性/方法名（例如 "add"）

### 与装饰器的关系

回顾一下前面的代码：

```typescript
@ParamTypes(Number, Number)
add(x, y) {
  return x + y;
}
```

当这个装饰器被应用时，它执行：

```typescript
Reflect.metadata("design:paramtypes", [Number, Number])
```

这实际上存储了元数据。然后，Reflect.getMetadata 就是用来读取这些已存储的元数据。

### 实际应用价值

这种机制在框架中的实际价值：

1. 依赖注入：NestJS 等框架可以读取构造函数的参数类型来自动注入依赖：

```typescript
 constructor(private userService: UserService) {}
   // 框架通过 Reflect.getMetadata("design:paramtypes", UserController) 获取 [UserService]
```

2. 参数验证：框架可以基于参数类型自动验证输入：

```typescript
   @Post()
   createUser(@Body() user: CreateUserDto) {}
   // 框架通过元数据知道需要验证 user 参数是否符合 CreateUserDto 的结构
```

3. 路由处理：您在前面看到的 @HostParam('host') 也是通过存储元数据，使 NestJS 知道要从请求的主机名中提取哪个参数。

简而言之，Reflect.getMetadata 是框架从运行时代码中"读取"开发者通过装饰器"写入"的类型信息和配置的关键机制，是实现"声明式编程"的核心技术。



## 业务场景代码剖析

```typescript
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}

```

### 详细分析

@Module({...}) 装饰器在底层做了以下工作：

1. 元数据存储：它使用 Reflect Metadata API 将传入的配置对象作为元数据存储在 CatsModule 类上
2. 关键元数据项：

- controllers: [CatsController] - 声明此模块管理的控制器

- providers: [CatsService] - 声明此模块提供的服务（可注入的依赖）

3. 工作原理

```typescript
   // 这是 @Module 装饰器的简化实现原理
   function Module(metadata) {
     return function(target) {
       // 可能使用一个特定的元数据键，如 'nestjs:module'
       Reflect.defineMetadata('nestjs:module', metadata, target);
     };
   }
```

### NestJS 如何使用这些元数据

当 NestJS 应用启动时：

1. 模块扫描：框架会扫描和处理所有模块
2. 元数据提取：对每个模块类，提取其 @Module 元数据
3. 依赖注入容器构建：

- 根据 providers 元数据注册服务到依赖注入容器

- 服务实例会被缓存并在需要时注入

4. 路由映射：

- 扫描 controllers 元数据中的控制器

- 处理每个控制器上的路由元数据

- 构建最终的 HTTP 路由表

具体流程:

```text
@Module 装饰器应用 → 元数据存储在 CatsModule 类上
           ↓
应用启动 → NestJS 扫描模块 → 读取 CatsModule 的元数据
           ↓
创建并注册 CatsService 的单例 → 创建 CatsController 实例并注入依赖
           ↓
构建路由表 → 应用准备就绪
```

所以 @Module 装饰器正是通过元数据机制告诉 NestJS："这个模块包含这些控制器和这些服务"，这些信息随后被框架用来构建整个应用的依赖图和路由系统。

## nestjs内布置metaData处理

Nest 的实现原理就是通过装饰器给 class 或者对象添加元数据，然后初始化的时候取出这些元数据，进行依赖的分析，然后创建对应的实例对象就可以了。

所以说，nest 实现的核心就是 Reflect metadata 的 api。

当然，现在 metadata 的 api 还在草案阶段，需要使用 reflect-metadata 这个 polyfill 包才行。

其实还有一个疑问，依赖的扫描可以通过 metadata 数据，但是创建的对象需要知道构造器的参数，现在并没有添加这部分 metadata 数据呀：

比如这个 CatsController 依赖了 CatsService，但是并没有添加 metadata 呀：

```typescript
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CatsService } from './cats.service';
import { CreateCatDto } from './dto/create-cat.dto';

@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Post()
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
  }

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
}

```

在您提供的 CatsController 示例中，虽然没有显式添加元数据来标记依赖关系，但 NestJS 依然能够实现依赖注入。这得益于 TypeScript 的类型系统和装饰器元数据功能。

## 自动依赖检测的原理

1. TypeScript 的类型元数据：

当你在 tsconfig.json 中启用了 emitDecoratorMetadata 选项后，TypeScript 编译器会自动为装饰过的类生成类型元数据。

![img](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d14d5736bef144a9a6830c7626b15b9f~tplv-k3u1fbpfcp-jj-mark:1512:0:0:0:q75.awebp)

2. 构造函数参数类型的元数据：

```typescript
   constructor(private readonly catsService: CatsService) {}
```

TypeScript 会为这个构造函数自动生成 design:paramtypes 元数据，其中包含了参数类型信息 [CatsService]。这是在不需要手动添加 @Inject() 的情况下实现的。

3. 控制器类装饰器触发元数据生成

```typescript
   @Controller('cats')
   export class CatsController { ... }
```

@Controller() 装饰器除了标记路由前缀外，还触发了 TypeScript 为这个类生成元数据的过程。

### 底层机制

当 NestJS 初始化时，它会：

1. 扫描 @Module 中声明的控制器
2. 对每个控制器，读取其构造函数的参数类型元数据：

```typescript
   // NestJS 内部实现（简化版）
   const paramTypes = Reflect.getMetadata('design:paramtypes', CatsController);
   // 得到 [CatsService]
```

3. 从依赖注入容器中查找或创建这些依赖的实例
4. 使用这些实例来创建控制器实例



### 与手动依赖声明的对比

这种机制比需要手动声明依赖的框架更加优雅：

- Angular 1.x：需要手动声明 controller.$inject = ['catsService']

- NestJS：直接从 TypeScript 类型系统获取这些信息

### 潜在局限

这种自动依赖注入依赖于 TypeScript 的类型信息，因此：

1. 必须使用类作为依赖类型（不能用接口，因为接口在运行时不存在）

1. 必须启用 emitDecoratorMetadata 编译选项

1. 复杂的依赖场景（如同一类型的多个不同实例）需要使用 @Inject(token) 手动指定

总之，NestJS 巧妙地利用了 TypeScript 的类型系统和装饰器元数据，实现了自动的依赖扫描和注入，使得代码更加简洁和声明式。





### 区分controller和普通对象生成的元数据

#### 两种元数据来源

1. TypeScript自动生成的标准元数据（启用emitDecoratorMetadata后）：

- design:type - 属性/方法的类型

- design:paramtypes - 参数类型数组

- design:returntype - 返回值类型

2. 手动添加的自定义元数据（如你图中的"名字"/"光光"）

   这是开发者或框架通过Reflect.metadata显式添加的:

   ```typescript
   import "reflect-metadata";
    
   class Guang {
     @Reflect.metadata("名字", "光光")
     public say(a: number): string {
       return '加油鸭';
     }
   }
   ```

TypeScript编译器会自动生成：

```typescript
__decorate([
  Reflect.metadata("名字", "光光"),          // 手动添加的自定义元数据
  __metadata("design:type", Function),      // TS自动生成的元数据
  __metadata("design:paramtypes", [Number]), // TS自动生成的元数据
  __metadata("design:returntype", String)   // TS自动生成的元数据
], Guang.prototype, "say", null);
```

而Controller路由控制器:

```typescript
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}
}
```

TypeScript编译器会自动生成：

```typescript
// 编译后的简化版本
__decorate([
  Controller('cats'),
  __metadata("design:paramtypes", [CatsService])  // 这是自动生成的！
], CatsController);
```

#### 主要区别

1. 显式vs隐式元数据添加:

- 您的代码：显式添加自定义元数据 @Reflect.metadata("名字", "光光")

- Controller：使用框架装饰器 @Controller(), @Get() 等，这些装饰器内部添加元数据

2. 元数据的内容与用途:

- 您的代码：添加名为"名字"的自定义元数据，值为"光光"

- Controller：添加路由信息、HTTP方法、参数提取方式等框架需要的元数据

3. TypeScript自动生成的元数据:

- 两者都会自动生成 design:paramtypes, design:type, design:returntype

- 但NestJS特别依赖这些自动生成的类型元数据来实现依赖注入

#### 实际情况是

Controller 确实生成了元数据，只是方式不同：

```typescript
@Controller('cats')
export class CatsController {
  // TypeScript自动生成类型元数据
  // 等效于 @Reflect.metadata("design:paramtypes", [CatsService])
  constructor(private readonly catsService: CatsService) {}
  
  @Get()
  // 框架装饰器内部添加路由元数据
  // 类似于 @Reflect.metadata("path", "/")
  // 并且TypeScript自动添加 @Reflect.metadata("design:returntype", Promise<Cat[]>)
  async findAll(): Promise<Cat[]> { ... }
}
```

#### NestJS装饰器的内部实现

NestJS的装饰器内部确实也是使用Reflect元数据API，只是被封装了：

```typescript
// NestJS @Controller装饰器的简化内部实现
function Controller(path) {
  return function(target) {
    Reflect.defineMetadata('path', path, target);
    // 其他框架需要的元数据...
  }
}
```

所以，最大的区别是：您的示例直接使用底层API添加自定义元数据，而NestJS提供了高级装饰器，在内部进行元数据处理，并结合TypeScript自动生成的类型元数据一起使用。



## 总结

**Nest 的装饰器的实现原理就是 Reflect.getMetadata、Reflect.defineMetadata 这些 api。**

通过在 class、method 上添加 metadata，然后扫描到它的时候取出 metadata 来做相应的处理来完成各种功能。

Nest 的 Controller、Module、Service 等等所有的装饰器都是通过 Reflect.meatdata 给类或对象添加元数据的，**然后初始化的时候取出来做依赖的扫描，实例化后放到 IOC 容器里。**

实例化对象还需要构造器参数的类型，这个开启 ts 的 emitDecoratorMetadata 的编译选项之后， ts 就会自动添加一些元数据，也就是 design:type、design:paramtypes、design:returntype 这三个，分别代表被装饰的目标的类型、参数的类型、返回值的类型。

当然，reflect metadata 的 api 还在草案阶段，需要引入 reflect metadata 的包做 polyfill。

Nest 还提供了 @SetMetadata 的装饰器，可以在 controller 的 class 和 method 上添加 metadata，然后在 interceptor 和 guard 里通过 reflector 的 api 取出来。

理解了 metadata，nest 的实现原理就很容易搞懂了。

