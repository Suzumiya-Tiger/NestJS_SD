# TypeORM结合NestJS的操作

## 1. 整体架构流程

```
NestJS Application
    ↓
TypeORM 配置 (forRoot)
    ↓
数据库连接建立
    ↓
实体注册 (entities)
    ↓
EntityManager/Repository 注入
    ↓
CRUD 操作执行
```

## 2. 数据库接入流程详解

### 第一步：TypeORM 配置与连接建立



```typescript
// app.module.ts - 你的配置
TypeOrmModule.forRoot({
  type: 'mysql',                    // 数据库类型
  host: '127.0.0.1',               // 数据库主机
  port: 3306,                      // 端口
  username: 'root',                // 用户名
  password: '177326',              // 密码
  database: 'typeorm_test',        // 数据库名
  synchronize: true,               // 自动同步表结构
  logging: false,                  // SQL 日志
  entities: [User],                // 注册的实体
  connectorPackage: 'mysql2',      // MySQL 驱动
})
```

**这个配置做了什么：**

1. NestJS 启动时，TypeORM 会根据这些配置建立数据库连接池
2. 扫描 `entities` 数组中的实体类，分析表结构
3. 如果 `synchronize: true`，会自动创建/更新数据库表
4. 创建 `EntityManager` 和各实体的 `Repository` 实例

### 第二步：实体映射

```typescript
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'aaa_user',
})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'aaa_name',
    length: 50,
  })
  name: string;
}

```

**TypeORM 会：**

1. 解析装饰器，理解表结构
2. 生成对应的 SQL CREATE TABLE 语句
3. 建立 JavaScript 对象与数据库记录的映射关系

## 3. 依赖注入机制

### EntityManager 注入原理

```typescript
// 你的代码
@Injectable()
export class UserService {
  @InjectEntityManager()
  private manager: EntityManager;  // 注入全局 EntityManager
}
```

**NestJS 的依赖注入是这样工作的：**

1. **容器注册**：TypeOrmModule.forRoot() 会在 IoC 容器中注册 EntityManager
2. **依赖解析**：当 UserService 被实例化时，NestJS 发现需要 EntityManager
3. **实例提供**：从容器中取出 EntityManager 实例并注入

### 两种注入方式对比

```typescript
// 方式1：EntityManager (你使用的)
@InjectEntityManager()
private manager: EntityManager;

// 方式2：Repository (更常用)
@InjectRepository(User)
private userRepository: Repository<User>;
```

## 4. 底层 SQL 执行流程

### TypeORM 如何将方法调用转换为 SQL

```typescript
// 当你调用这个方法时：
await this.manager.find(User, { where: { id: 1 } });

// TypeORM 内部会：
// 1. 分析 User 实体的元数据
// 2. 构建 SQL 查询
// 3. 执行 SQL
// 4. 将结果映射回 User 对象
```

**具体转换过程：**

```sql
-- 1. create() 操作
INSERT INTO users (name) VALUES (?, ?, NOW())

-- 2. findAll() 操作  
SELECT users.id, users.name FROM users ORDER BY users.id DESC

-- 3. findOne() 操作
SELECT users.id, users.name FROM users WHERE users.id = ? LIMIT 1

-- 4. update() 操作
UPDATE users SET name = ? WHERE id = ?

-- 5. delete() 操作
DELETE FROM users WHERE id = ?
```

## 5. 完整的数据流向

```
Controller 接收请求
    ↓
调用 Service 方法
    ↓
Service 通过 EntityManager 操作数据
    ↓
EntityManager 生成 SQL 语句
    ↓
通过连接池发送到 MySQL
    ↓
MySQL 执行并返回结果
    ↓
TypeORM 将结果映射为实体对象
    ↓
Service 返回给 Controller
    ↓
Controller 响应给客户端
```

## 6. 配置优化建议

### 完善的 app.module.ts 配置

```typescript
@Module({
  imports: [
    UserModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      username: 'root',
      password: '177326',
      database: 'typeorm_test',
      
      // 开发环境配置
      synchronize: process.env.NODE_ENV !== 'production', // 生产环境关闭
      logging: process.env.NODE_ENV === 'development',     // 开发环境开启日志
      
      // 实体配置
      entities: [User],
      autoLoadEntities: true, // 自动加载 forFeature 注册的实体
      
      // 连接池配置
      poolSize: 10,
      acquireTimeout: 60000,
      timeout: 60000,
      
      // MySQL 特定配置
      connectorPackage: 'mysql2',
      extra: {
        authPlugin: 'sha256_password',
        connectionLimit: 10,
      },
      
      // 重试配置
      retryAttempts: 5,
      retryDelay: 3000,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## 7. 最佳实践总结

### 1. 使用 Repository 模式（推荐）

```typescript
// 更好的做法
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }
}
```

### 2. 添加错误处理

```typescript
async create(createUserDto: CreateUserDto): Promise<User> {
  try {
    return await this.manager.save(User, createUserDto);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new BadRequestException('邮箱已存在');
    }
    throw new InternalServerErrorException('创建用户失败');
  }
}
```

### 3. 使用事务处理复杂操作

```typescript
async transferData(fromId: number, toId: number, amount: number) {
  return this.manager.transaction(async (manager) => {
    // 所有操作要么全部成功，要么全部失败
    await manager.update(User, fromId, { balance: () => `balance - ${amount}` });
    await manager.update(User, toId, { balance: () => `balance + ${amount}` });
  });
}
```

这就是 TypeORM 与 NestJS 结合的完整工作流程。通过依赖注入、装饰器和元数据反射，实现了对象关系映射和数据库操作的自动化。



# UserService

## 概述

`UserService` 是一个基于 NestJS 和 TypeORM 的用户管理服务类，提供了完整的用户 CRUD 操作、分页查询、搜索和批量操作功能。

## 依赖项

- `@nestjs/common` - NestJS 核心模块，提供装饰器和异常类
- `@nestjs/typeorm` - TypeORM 集成模块
- `typeorm` - TypeORM ORM 框架
- `User` 实体 - 用户数据模型
- 相关 DTO 类

## 类结构

### 接口定义

```typescript
interface PaginationResult<T> {
  data: T[];           // 数据列表
  total: number;       // 总记录数
  page: number;        // 当前页码
  limit: number;       // 每页记录数
  totalPages: number;  // 总页数
}
```

### 辅助函数

```typescript
function getErrorMessage(error: unknown): string
```

提取错误信息的辅助函数，确保错误处理的类型安全。

## 构造函数

```typescript
constructor(
  @InjectRepository(User) 
  private userRepository: Repository<User>
)
```

通过依赖注入获取 User 实体的 Repository 实例。

## 核心方法

### 1. 创建用户 - `create()`

```typescript
async create(createUserDto: CreateUserDto): Promise<User>
```

**功能**: 创建新用户

**参数**:

- `createUserDto`: 创建用户的数据传输对象

**返回值**: 创建成功的用户实体

**业务逻辑**:

1. 检查用户名是否已存在
2. 如果用户名已存在，抛出 BadRequestException
3. 创建用户实体实例
4. 保存到数据库并返回

**异常处理**:

- `BadRequestException`: 用户名已被使用
- `InternalServerErrorException`: 创建失败的其他错误

### 2. 查询所有用户 - `findAll()`

```typescript
async findAll(): Promise<User[]>
```

**功能**: 获取所有用户列表

**返回值**: 用户数组，按 ID 降序排列

**异常处理**:

- `InternalServerErrorException`: 查询失败

### 3. 根据 ID 查询用户 - `findOne()`

```typescript
async findOne(id: number): Promise<User>
```

**功能**: 根据用户 ID 查询单个用户

**参数**:

- `id`: 用户 ID

**返回值**: 用户实体

**异常处理**:

- `NotFoundException`: 用户不存在
- `InternalServerErrorException`: 查询失败

### 4. 更新用户 - `update()`

```typescript
async update(id: number, updateUserDto: UpdateUserDto): Promise<User>
```

**功能**: 更新指定用户信息

**参数**:

- `id`: 用户 ID
- `updateUserDto`: 更新用户的数据传输对象

**返回值**: 更新后的用户实体

**业务逻辑**:

1. 检查用户是否存在
2. 验证更新数据不为空
3. 如果更新用户名，检查新用户名是否与其他用户重复
4. 执行更新操作
5. 返回更新后的用户信息

**异常处理**:

- `NotFoundException`: 用户不存在
- `BadRequestException`: 更新数据无效或用户名重复
- `InternalServerErrorException`: 更新失败

### 5. 删除用户 - `remove()`

```typescript
async remove(id: number): Promise<{ message: string; deletedId: number }>
```

**功能**: 删除指定用户

**参数**:

- `id`: 用户 ID

**返回值**: 包含删除成功消息和被删除用户 ID 的对象

**业务逻辑**:

1. 检查用户是否存在
2. 执行删除操作
3. 验证删除是否成功
4. 返回删除结果

**异常处理**:

- `NotFoundException`: 用户不存在
- `InternalServerErrorException`: 删除失败

## 查询方法

### 6. 根据用户名查询 - `findByName()`

```typescript
async findByName(name: string): Promise<User | null>
```

**功能**: 根据用户名查询用户

**参数**:

- `name`: 用户名

**返回值**: 用户实体或 null

### 7. 分页查询 - `findWithPagination()`

```typescript
async findWithPagination(paginationDto: PaginationDto): Promise<PaginationResult<User>>
```

**功能**: 分页查询用户列表

**参数**:

- ```
  paginationDto
  ```

  : 分页参数对象

  - `page`: 页码（默认 1）
  - `limit`: 每页记录数（默认 10）

**返回值**: 包含分页信息的结果对象

### 8. 模糊搜索 - `searchByName()`

```typescript
async searchByName(name: string): Promise<User[]>
```

**功能**: 按用户名进行模糊搜索

**参数**:

- `name`: 搜索关键词

**返回值**: 匹配的用户数组

**实现**: 使用 QueryBuilder 构建 LIKE 查询

### 9. 统计用户总数 - `count()`

```typescript
async count(): Promise<number>
```

**功能**: 统计用户总数

**返回值**: 用户总数

### 10. 检查用户名是否存在 - `isNameExists()`

```typescript
async isNameExists(name: string): Promise<boolean>
```

**功能**: 检查指定用户名是否已存在

**参数**:

- `name`: 用户名

**返回值**: 布尔值，true 表示存在，false 表示不存在

## 高级功能

### 11. 批量创建用户 - `createMultipleUsers()`

```typescript
async createMultipleUsers(createUserDtos: CreateUserDto[]): Promise<User[]>
```

**功能**: 在事务中批量创建多个用户

**参数**:

- `createUserDtos`: 创建用户的 DTO 数组

**返回值**: 创建成功的用户数组

**特性**:

- 使用数据库事务确保原子性
- 批量操作过程中任何错误都会回滚所有操作
- 检查每个用户名的唯一性

**业务逻辑**:

1. 开启数据库事务
2. 遍历每个 DTO
3. 检查用户名唯一性
4. 创建并保存用户
5. 如果任何步骤失败，回滚整个事务

## 错误处理策略

### 异常类型

1. **BadRequestException**
   - 用户名已存在
   - 更新数据无效
   - 业务规则违反
2. **NotFoundException**
   - 用户不存在
3. **InternalServerErrorException**
   - 数据库操作失败
   - 系统内部错误

### 错误处理模式

```typescript
try {
  // 业务逻辑
} catch (error) {
  if (error instanceof SpecificException) {
    throw error; // 重新抛出已知异常
  }
  throw new InternalServerErrorException(`操作失败: ${getErrorMessage(error)}`);
}
```

## 使用示例

### 基本 CRUD 操作

```typescript
// 创建用户
const newUser = await userService.create({ name: '张三' });

// 查询所有用户
const users = await userService.findAll();

// 查询单个用户
const user = await userService.findOne(1);

// 更新用户
const updatedUser = await userService.update(1, { name: '李四' });

// 删除用户
const result = await userService.remove(1);
```

### 高级查询

```typescript
// 分页查询
const paginatedUsers = await userService.findWithPagination({
  page: 1,
  limit: 10
});

// 模糊搜索
const searchResults = await userService.searchByName('张');

// 检查用户名是否存在
const exists = await userService.isNameExists('张三');
```

### 批量操作

```typescript
// 批量创建用户
const users = await userService.createMultipleUsers([
  { name: '用户1' },
  { name: '用户2' },
  { name: '用户3' }
]);
```

## 最佳实践

1. **异常处理**: 每个方法都有完整的异常处理机制
2. **事务管理**: 批量操作使用事务确保数据一致性
3. **业务验证**: 在数据操作前进行必要的业务规则验证
4. **类型安全**: 使用 TypeScript 类型和 DTO 确保类型安全
5. **错误消息**: 提供清晰、有意义的错误消息

## 数据库交互

### 使用的 TypeORM 方法

- `findOne()`: 单条记录查询
- `find()`: 多条记录查询
- `findAndCount()`: 分页查询
- `create()`: 创建实体实例
- `save()`: 保存实体到数据库
- `update()`: 更新记录
- `delete()`: 删除记录
- `count()`: 统计记录数
- `createQueryBuilder()`: 构建复杂查询
- `transaction()`: 事务管理

### 生成的 SQL 示例

```sql
-- 创建用户
INSERT INTO aaa_user (aaa_name) VALUES ('张三');

-- 查询所有用户
SELECT * FROM aaa_user ORDER BY id DESC;

-- 更新用户
UPDATE aaa_user SET aaa_name = '李四' WHERE id = 1;

-- 删除用户
DELETE FROM aaa_user WHERE id = 1;

-- 模糊搜索
SELECT * FROM aaa_user WHERE aaa_name LIKE '%张%' ORDER BY id DESC;
```

## 性能考虑

1. **索引建议**: 为 `name` 字段添加唯一索引
2. **分页查询**: 使用 `skip` 和 `take` 进行高效分页
3. **事务使用**: 仅在必要时使用事务，避免长时间锁定
4. **查询优化**: 使用 QueryBuilder 进行复杂查询优化

## 扩展建议

1. **缓存**: 考虑为常用查询添加缓存机制
2. **软删除**: 实现软删除功能以支持数据恢复
3. **审计日志**: 添加操作日志记录
4. **批量操作优化**: 对大批量操作进行分批处理
5. **权限控制**: 添加用户权限验证机制
