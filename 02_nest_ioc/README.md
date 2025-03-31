

# IoC解决了什么问题？

后端系统中，会有很多对象：

- Controller 对象：接收 http 请求，调用 Service，返回响应
- Service 对象：实现业务逻辑
- Repository 对象：实现对数据库的增删改查

此外，还有数据库链接对象 DataSource，配置对象 Config 等等。

这些对象有着错综复杂的关系：

Controller 依赖了 Service 实现业务逻辑，Service 依赖了 Repository 来做增删改查，Repository 依赖 DataSource 来建立连接，DataSource 又需要从 Config 对象拿到用户名密码等信息。

这就导致了创建这些对象是很复杂的，你要理清它们之间的依赖关系，哪个先创建哪个后创建。

比如这样：

```javascript
javascript

复制代码const config = new Config({ username: 'xxx', password: 'xxx'});

const dataSource = new DataSource(config);

const repository = new Repository(dataSource);

const service = new Service(repository);

const controller = new Controller(service);
```

要经过一系列的初始化之后才可以使用 Controller 对象。

而且像 config、dataSource、repository、service、controller 等这些对象不需要每次都 new 一个新的，一直用一个就可以，也就是保持单例。

在应用初始化的时候，需要理清依赖的先后关系，创建一大堆对象组合起来，还要保证不要多次 new，是不是很麻烦？

没错，这是一个后端系统都有的痛点问题。

解决这个痛点的方式就是 IoC（Inverse of Control）。

java 的 Spring 就实现了 IoC，Nest 也同样实现了。

那什么是 IoC 呢？

之前我们手动创建和组装对象不是很麻烦么，我能不能在 class 上声明依赖了啥，然后让工具去分析我声明的依赖关系，根据先后顺序自动把对象创建好了并组装起来呢？

![img](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6a02ad15e2504619920e06730a00fedb~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=932&h=550&s=103716&e=png&b=1f1f1f)

比如这样声明 AppController 依赖了这两个 Service，然后让工具分析依赖自动帮我创建好这三个对象并设置依赖关系。

这就是 IoC 的实现思路。

它有一个放对象的容器，程序初始化的时候会扫描 class 上声明的依赖关系，然后把这些 class 都给 new 一个实例放到容器里。

创建对象的时候，还会把它们依赖的对象注入进去。

这样不就完成了自动的对象创建和组装么？

这种依赖注入的方式叫做 Dependency Injection，简称 DI。

而这种方案为什么叫 IoC 也很容易理解了，本来是手动 new 依赖对象，然后组装起来，现在是声明依赖了啥，等待被注入。

从主动创建依赖到被动等待依赖注入，这就是 Inverse of Control，反转控制。

在 class 上声明依赖的方式，大家都选择了装饰器的方式（在 java 里这种语法叫做注解）。

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2d890fa5e94e49beb7b296589afb4452~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=898&h=540&s=101458&e=png&b=1f1f1f)

比如上面就是声明这个 class 要放到 IOC 容器里，然后它的依赖是啥。

这样 IOC 容器扫描到它就知道怎么创建它的对象了。

知道了 IOC 是啥，下面我们来看看真实的 Nest 项目里是怎么用 IoC 的：

```arduino
npx nest new nest-ioc
```

执行上面的命令，它会创建一个 nest 项目：

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c646a1a3d6e346dab7cc4ed507997ba7~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

选择一个 npm 包管理工具，然后 nest cli 会自动创建项目结构并安装依赖：

![img](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2e06a93b361f49888d95bd78a05b55eb~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

然后进入这个目录，执行 npm run start，把服务跑起来：

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fb4b95248dbd4a9493e6b3e05d407f1a~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp)

浏览器访问 [http://localhost:3000](https://link.juejin.cn/?target=http%3A%2F%2Flocalhost%3A3000) 就可以看到 nest 服务返回的 hello world：



## controller和service的区别



controller和service都需要在Module中被注册。

service需要通过@Injectable来声明这个AppService可以在全局被注入使用，通过声明了@Injectable()，可以实现nest将其存入IOC容器之中以供调用。

```javascript
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

而AppController声明了@Controller，代表了这个class可以被注入，nest也会把它放入到IOC容器之中。

**AppController的构造器参数依赖了AppService。**

```javascript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
// @Contronller()被声明以后，下面的AppController也代表这个class是一个controller，
// 然后nest会根据这个controller的定义，自动生成一个路由，然后把这个路由注册到nest的路由系统中。
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

```



为什么 Controller 是单独的装饰器呢？

因为 Service 是可以被注入也是可以注入到别的对象的，所以用 @Injectable 声明。

而 Controller 只需要被注入，所以 nest 单独给它加了 @Controller 的装饰器。

然后在 AppModule 里引入：

```javascript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

```

一旦在入口模块跑起来后，nest就会在AppModule上解析class通过装饰器声明的依赖信息，自动创建和组装对象。



这也是为什么AppController只是声明了对AppService的依赖，就可以直接调用它的方法的原因。



nest在背后自己主动执行了对象的创建和依赖创建工作。

## 什么是 IoC 容器

IoC（控制反转）容器是框架中的一个核心组件，负责：

- 依赖的注册：记录哪些类可以被注入（通过装饰器标记）

- 依赖图管理：维护一个完整的依赖关系网络

- 实例的创建与缓存：负责创建类的实例并在适当的情况下复用它们

- 依赖的注入：将依赖实例传递给需要它们的组件

- 生命周期管理：控制实例的创建和销毁时机

NestJS 的 IoC 容器实质上是一个智能的"对象工厂"，它知道如何创建和管理应用中的所有组件，从而让开发者专注于业务逻辑而非对象创建逻辑。

## @Injectable

当我们声明了该装饰器的时候，NestJS的IOC(控制反转)容器会执行以下操作：

### 1.元数据注册

```javascript
@Injectable()
export class AppService {}
```

在这里为这个类附加特殊的元数据，并主动标记这个类是可执行的依赖项。

利用ts的元数据反射系统，存储类的构造函数参数类型信息。



### 2.依赖关系识别

- 分析被标记类的构造函数。
- 自动识别构造函数参数中声明的所有依赖类型。
- 构建内部依赖关系图。



### 3.注册到IOC容器

当类被定义在某个模块的providers数组中的时候，NESTJS会将其实例化逻辑注册到IOC容器上。

创建一个提供者标识符(通常是类本身)和其实例化策略的映射。

```javascript
@Injectable()
export class AppService {}
```

### 

### 4.实例化和依赖解析

当需要该服务的实例时，IOC容器负责:

- 检查该类是否已有实例(单例模式)
- 递归解析并实例化所有依赖
- 按正确顺序创建所有必要的实例
- 将依赖注入到请求者之中



### 5.生命化周期管理

- 默认情况下，所有的providers都是单例(在整个应用生命周期内共享一个实例)
- IOC容器负责维护实例的生命周期，确保在合适的时机创建和销毁实例
- 支持自定义域:SINGLETON(默认),REQUEST,TRANSIENT



### 6.IOC容器的核心价值

- 自动化依赖系统管理
- 实现松耦合架构
- 简化测试(通过依赖替换)
- 统一的生命周期管理
- 保持代码组织的一致性

这一套机制可以保证我们不用关心手动实例化和管理复杂的依赖关系，让框架基于声明式配置来自动处理这些复杂性。









