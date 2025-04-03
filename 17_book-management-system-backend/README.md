# 登录构建

首先生成user对应的module,使用命令:
`nest g resource user --no-spec`



## 注册

首先在user.controller.ts定义注册:


```typescript
  @Post('register')
  register(@Body() registerUserDto: RegisterUserDto) {
    console.log('registerUserDto', registerUserDto);
  }
```



在生成对应的dto以后:
```TS
import { IsNotEmpty, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty({ message: '用户名不得为空' })
  username: string;
  @IsNotEmpty({ message: '密码不得为空' })
  @MinLength(6, { message: '密码长度不得小于6位' })
  password: string;
}

```

立刻跑到app.module.ts里面去引入ValidationPipe，并且一定要记住需要安装这两个必要的依赖包:

```shell
 pnpm add install --save class-transformer class-validator
```

```typescript
import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { APP_PIPE } from '@nestjs/core';

@Module({
  imports: [UserModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        // 过滤掉请求体中没有的属性
        whitelist: true,
        // 将请求体中的属性转换为指定的类型
        transform: true,
        // 如果请求体中存在没有的属性，则抛出异常
        forbidNonWhitelisted: true,
        // 如果请求体中存在未知属性，则抛出异常
        forbidUnknownValues: true,
      }),
    },
  ],
})
export class AppModule {}

```

这样注册和注册参数验证的基本框架就搭好了。



### 动态模块的生成

因为这里需要一个module来存json数据，所以需要一个动态module来进行运行时写入数据的操作。

在user.module.ts中引入动态模块，并且传递参数:

```TS
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DbModule } from '../db/db.module';

@Module({
  imports: [
    // 这种需要传参的模块是动态模块来的，不能直接定义为静态模块
    // 采用工厂模式来生成一个支持运行时根据传入参数返回定制化的模块
    DbModule.register({
      path: 'user.json',
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

```

这里一定一定要注意，回忆一下动态模块是用什么生成的？
这里应用的是工厂函数设计模式。

工厂函数是一种设计模式，指的是一个用于创建对象的函数，而不是直接使用构造函数创建对象。它有以下特点：

1. 封装创建逻辑：工厂函数封装了对象的创建过程，使调用者不需要了解对象如何被创建。
2. 参数化创建：可以根据传入的参数动态决定创建什么样的对象或如何配置对象。
3. 复用性：相同的工厂函数可以被多次调用，每次创建不同配置的对象。

在 NestJS 的动态模块中，如 DbModule.register() 就是一个工厂函数：

- 它接收配置参数 { path: 'user.json' }

- 根据这些参数创建并返回一个定制化的模块定义

- 返回的模块包含特定的 providers、exports 等

这种方式允许同一个模块代码可以根据不同参数创建不同配置的模块实例，增强了模块的灵活性和可重用性。

db.module.ts

```typescript
import { DynamicModule, Module } from '@nestjs/common';
import { DbService } from './db.service';
export interface DbModuleOptions {
  path: string;
}
@Module({})
export class DbModule {
  static register(options: DbModuleOptions): DynamicModule {
    return {
      module: DbModule,
      providers: [
        {
          provide: 'OPTIONS',
          useValue: options,
        },
        DbService,
      ],
      exports: [DbService],
    };
  }
}

```

- @Module({}) 装饰器初始化一个空模块

- 静态方法 register 返回一个符合 DynamicModule 接口的对象

### 运行时机制

1. 模块注册阶段：当其他模块导入 DbModule.register({...}) 时，这个静态方法被执行
2. 配置转换：传入的参数被转换为 provider ('OPTIONS')
3. 依赖注入准备：返回的 DynamicModule 对象被 NestJS 的 DI 容器解析
4. 模块合成：NestJS 将返回的动态模块定义与静态定义合并

### 依赖注入链路

1. 配置参数作为值 provider 被注册到 DI 容器
2. 服务可以通过 @Inject('OPTIONS') 访问这些值
3. 服务可以基于注入的配置参数自定义行为

### 模块组合原理

动态模块返回的对象覆盖或扩展了静态定义的模块，包含：

- module: 指向模块类本身

- providers: 注册服务和值

- **exports: 控制哪些服务对外可见**

这种设计使得单个模块代码可以根据不同参数产生不同配置的模块实例，实现了高度的复用性和灵活性。





### dBservice的设计

我们会在service里面实现文件存储的写入和读取:

```TS
import { Inject, Injectable } from '@nestjs/common';
import { DbModuleOptions } from './db.module';
import { access, readFile, writeFile } from 'fs/promises';

@Injectable()
export class DbService {
  @Inject('OPTIONS')
  private options: DbModuleOptions;

  async read() {
    // 获取db.module.ts传入的动态配置
    const filePath = this.options.path;
    try {
      // 如果文件不存在，则创建一个空文件
      await access(filePath);
    } catch (_) {
      return [];
    }

    const str = await readFile(filePath, {
      encoding: 'utf-8',
    });

    if (!str) {
      return [];
    }

    return JSON.parse(str) as Record<string, any>[];
  }

  async write(obj: Record<string, any>) {
    await writeFile(this.options.path, JSON.stringify(obj || [], null, 2), {
      encoding: 'utf-8',
    });
  }
}

```

  **1. 依赖注入**

```typescript
@Injectable()
export class DbService {
  @Inject('OPTIONS')
  private options: DbModuleOptions;
```

​	•	@Injectable() 装饰器表明 DbService 是一个可被依赖注入的服务。

​	•	@Inject('OPTIONS') 注入了一个名为 OPTIONS 的配置对象，它的类型是 DbModuleOptions，用于存储数据库文件路径等配置信息。



------



**2. 读取 JSON 文件**

```typescript
async read() {
  const filePath = this.options.path;
  try {
    await access(filePath);
  } catch (_) {
    return [];
  }

  const str = await readFile(filePath, { encoding: 'utf-8' });

  if (!str) {
    return [];
  }

  return JSON.parse(str);
}
```

​	•	filePath = this.options.path; 获取数据库文件路径。

​	•	await access(filePath); 检查文件是否存在。如果不存在，直接返回空数组 []，防止读取错误。

​	•	const str = await readFile(filePath, { encoding: 'utf-8' }); 读取文件内容。

​	•	if (!str) return []; 处理空文件情况。

​	•	return JSON.parse(str); 将 JSON 字符串解析成 JavaScript 对象并返回。

**3. 写入 JSON 文件**

```typescript
async write(obj: Record<string, any>) {
  await writeFile(this.options.path, JSON.stringify(obj||[]), {
    encoding:"utf-8"
  });
}
```

​	•	JSON.stringify(obj,||[]) 这一部分存在错误，应修改为 JSON.stringify(obj || [])，否则会导致语法错误。

​	•	await writeFile(this.options.path, JSON.stringify(obj || []), { encoding: "utf-8" }); 将 JavaScript 对象转换为 JSON 字符串并写入文件。



### userService

```typescript
export class UserService {
  @Inject(DbService)
  private readonly dbService: DbService;

  async register(registerUserDto: RegisterUserDto) {
    const users = (await this.dbService.read()) as User[];
    const foundUser = users.find(
      (item) => item.username === registerUserDto.username,
    );
    if (foundUser) {
      throw new BadRequestException('用户已注册');
    }
    const user = new User();
    user.username = registerUserDto.username;
    user.password = registerUserDto.password;
    users.push(user);
    await this.dbService.write(users);
    return user;
  }
  ......
  ......
```



梳理一下流程，db.service.ts负责了具体的I/O写入和读取操作，它不负责真是的业务逻辑处理，而是充当了业务逻辑的数据处理中介，实际上的业务处理则是在user.service.ts中完成的，它在里面针对dbService进行了数据获取和数据写入操作。

同时还通过检测用户名是否重复，应用了` new BadRequestException('用户已注册');`，做了合理的错误处理。



## 书籍处理

切记我们在book.module.ts中需要动态注册模块，并且传入一个新的json路径:

```ts
import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { DbModule } from 'src/db/db.module';

@Module({
  imports: [
    // 导入动态模块(数据库)请应用register来注册数据库的路径
    DbModule.register({
      path: 'book.json',
    }),
  ],
  controllers: [BookController],
  providers: [BookService],
})
export class BookModule {}

```

在book.service.ts中做好数据去重处理:
```typescript
import { UpdateBookDto } from './dto/update-book.dto';
import { CreateBookDto } from './dto/create-book.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { Inject } from '@nestjs/common';
import { Book } from './entities/book.entity';
function randomNum() {
  return Math.floor(Math.random() * 1000000);
}
@Injectable()
export class BookService {
  @Inject()
  private dbService: DbService;
  async list() {
    const books = (await this.dbService.read()) as Book[];
    return books;
  }

  async findById(id: number) {
    const books = (await this.dbService.read()) as Book[];
    const result = books.find((book) => book.id === id);
    return result;
  }

  async create(createBookDto: CreateBookDto) {
    const books = (await this.dbService.read()) as Book[];
    const book = new Book();
    const foundBook = books.find((book) => book.name === createBookDto.name);
    if (foundBook) {
      throw new BadRequestException('图书已存在');
    }
    book.id = randomNum();
    book.author = createBookDto.author;
    book.name = createBookDto.name;
    book.description = createBookDto.description;
    book.cover = createBookDto.cover;

    books.push(book);
    await this.dbService.write(books);
    books.push(book);
  }

  async update(updateBookDto: UpdateBookDto) {
    const books = (await this.dbService.read()) as Book[];
    const foundBook = books.find((book) => book.id === updateBookDto.id);
    if (!foundBook) {
      throw new NotFoundException('图书不存在');
    }
    foundBook.name = updateBookDto.name ?? foundBook.name;
    foundBook.author = updateBookDto.author ?? foundBook.author;
    foundBook.description = updateBookDto.description ?? foundBook.description;
    foundBook.cover = updateBookDto.cover ?? foundBook.cover;

    await this.dbService.write(books);
    return foundBook;
  }

  async delete(id: number) {
    const books: Book[] = (await this.dbService.read()) as Book[];
    const index = books.findIndex((item) => item.id === id);
    if (index !== -1) {
      books.splice(index, 1);
      await this.dbService.write(books);
    }
  }
}

```



我们最好在dbService针对传入的数据也进行一层去重处理，以防止重复数据写入，但是writeFile无须担心，因为writeFile写入的是覆盖操作:
```ts
import { Inject, Injectable } from '@nestjs/common';
import { DbModuleOptions } from './db.module';
import { access, readFile, writeFile } from 'fs/promises';

@Injectable()
export class DbService {
  @Inject('OPTIONS')
  private options: DbModuleOptions;

  async read() {
    // 获取db.module.ts传入的动态配置
    const filePath = this.options.path;
    try {
      // 如果文件不存在，则返回空数组
      await access(filePath);
    } catch (_) {
      // Ignore error
      return [];
    }

    const str = await readFile(filePath, {
      encoding: 'utf-8',
    });

    if (!str) {
      return [];
    }

    return JSON.parse(str) as Record<string, any>[];
  }

  async write(obj: Record<string, any>[]) {
    const uniqueObj = Array.from(
      new Map(
        obj.map((item) => [item.id, item] as [number, typeof item]),
      ).values(),
    );
    await writeFile(
      this.options.path,
      JSON.stringify(uniqueObj || [], null, 2),
      {
        encoding: 'utf-8',
      },
    );
  }
}

```



### 上传书籍封面

```typescript
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: storage,
      limits: {
        fileSize: 1024 * 1024 * 3,
      },
      fileFilter: (req, file, cb) => {
        const extname = path.extname(file.originalname);
        if (['.png', '.jpg', '.jpeg'].includes(extname)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('只能上传png,jpg,jpeg格式的图片'), false);
        }
      },
    }),
  )
  uplodaFile(@UploadedFile() file: Express.Multer.File) {
    console.log('file', file);
    return {
      url: file.path,
    };
  }
```











































