## typeorm流程分析

### 1. 导入依赖

```typescript
import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User"
```

- `reflect-metadata`：TypeORM 依赖的元数据反射库，必须在应用启动前导入
- `DataSource`：TypeORM 的核心类，用于管理数据库连接
- `User`：自定义的实体类

### 2. 数据源配置详解

```typescript
export const AppDataSource = new DataSource({
    type: "mysql",                    // 数据库类型
    host: "127.0.0.1",               // 数据库主机地址
    port: 3306,                      // 数据库端口
    username: "root",                // 用户名
    password: "177376",              // 密码
    database: "practice",            // 数据库名
    synchronize: true,               // 自动同步实体到数据库
    entities: [User],                // 实体类数组
    migrations: [],                  // 数据库迁移文件
    subscribers: [],                 // 事件订阅者
    connectorPackage: 'mysql2',      // MySQL 连接器包
    extra: {
        authPlugin: 'sha256_password', // MySQL 认证插件
    }
})
```

## TypeORM 如何通过 Entity 生成数据库

### 1. 实体定义示例

```typescript
// entity/User.ts
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    age: number
}
```

### 2. 生成流程

**步骤 1：装饰器元数据收集**

- TypeORM 使用装饰器（如 `@Entity`、`@Column`）收集实体的元数据
- `reflect-metadata` 库将这些信息存储在类的元数据中

**步骤 2：数据源初始化**

```typescript
AppDataSource.initialize().then(() => {
    console.log("数据源初始化成功")
}).catch(error => console.log(error))
```

**步骤 3：同步机制** 当 `synchronize: true` 时，TypeORM 会：

1. 分析所有实体的元数据
2. 生成对应的 DDL 语句
3. 与现有数据库结构对比
4. 自动创建/修改表结构

### 3. 具体映射规则

```typescript
@Entity("users")              // → CREATE TABLE users
export class User {
    @PrimaryGeneratedColumn() // → id INT AUTO_INCREMENT PRIMARY KEY
    id: number

    @Column({
        type: "varchar",      // → firstName VARCHAR(255)
        length: 255
    })
    firstName: string

    @Column({
        type: "int",          // → age INT
        nullable: true        // → age INT NULL
    })
    age?: number

    @CreateDateColumn()       // → created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    createdAt: Date
}
```

### 4. 关系映射

```typescript
@Entity()
export class User {
    @OneToMany(() => Photo, photo => photo.user)
    photos: Photo[]           // → 不直接创建字段，通过外键关联
}

@Entity()
export class Photo {
    @ManyToOne(() => User, user => user.photos)
    user: User                // → 创建 userId 外键字段
}
```

## 注意事项

1. **生产环境警告**：`synchronize: true` 仅适用于开发环境，生产环境应使用 migrations
2. **性能影响**：每次启动都会检查结构差异，影响启动速度
3. **数据安全**：自动同步可能导致数据丢失，建议先备份

## 最佳实践建议

```typescript
// 开发环境
export const AppDataSource = new DataSource({
    // ... 其他配置
    synchronize: process.env.NODE_ENV === 'development',
    logging: true,  // 开启 SQL 日志
})

// 生产环境使用 migrations
export const AppDataSource = new DataSource({
    // ... 其他配置
    synchronize: false,
    migrationsRun: true,
    migrations: ["src/migrations/*.ts"],
})
```

这样 TypeORM 就能根据你定义的实体类自动管理数据库结构，大大简化了数据库开发工作。



# 删除

delete删除法:

```typescript
  await AppDataSource.manager.delete(User, 1)
  await AppDataSource.manager.delete(User, [2, 3])
  console.log("Saved a new user with id: " + user.id)
```

remove删除法:

```typescript
 // remove删除法
  await AppDataSource.manager.remove(User, user)
```

**delete 删除是通过直接传 id、而 remove 则是传入整个实例化后的 entity 对象。**

## 主键识别机制

### 1. 装饰器元数据存储

当你定义 User 实体时：

```typescript
@Entity()
export class User {
    @PrimaryGeneratedColumn()  // 这个装饰器很关键
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string
}
```

`@PrimaryGeneratedColumn()` 装饰器告诉 TypeORM：

- `id` 字段是这个实体的**主键**
- 这个信息会被存储在实体的元数据中

### 2. TypeORM 内部工作原理

```typescript
// 当你调用 delete 方法时
await AppDataSource.manager.delete(User, 1);
```

TypeORM 内部执行以下步骤：

1. **获取实体元数据**：

```typescript
const metadata = AppDataSource.getMetadata(User);
const primaryColumn = metadata.primaryColumns[0]; // 获取主键列信息
console.log(primaryColumn.propertyName); // 输出: "id"
console.log(primaryColumn.databaseName); // 输出: "id"
```

1. **构建 SQL 语句**：

```sql
-- 对于 delete(User, 1)
DELETE FROM user WHERE id = 1

-- 对于 delete(User, [2,3])
DELETE FROM user WHERE id IN (2, 3)
```

### 3. 验证这个机制

你可以通过以下代码验证：

```typescript
AppDataSource.initialize().then(async () => {
    // 获取 User 实体的元数据
    const userMetadata = AppDataSource.getMetadata(User);
    
    console.log("表名:", userMetadata.tableName);
    console.log("主键列:", userMetadata.primaryColumns.map(col => col.propertyName));
    
    // 这会输出: ["id"]
    
    // 所有列信息
    console.log("所有列:", userMetadata.columns.map(col => 
        `${col.propertyName} (${col.type})`
    ));
}).catch(error => console.log(error));
```

### 4. 复合主键的情况

如果你有复合主键：

```typescript
@Entity()
export class UserProfile {
    @PrimaryColumn()
    userId: number

    @PrimaryColumn()
    profileType: string

    @Column()
    value: string
}
```

删除时需要提供完整的主键信息：

```typescript
// 必须提供所有主键字段
await AppDataSource.manager.delete(UserProfile, {
    userId: 1,
    profileType: "avatar"
});

// 或者删除多个
await AppDataSource.manager.delete(UserProfile, [
    { userId: 1, profileType: "avatar" },
    { userId: 1, profileType: "banner" }
]);
```

### 5. 其他删除方式对比

```typescript
// 方式1: 按主键删除 (你使用的方式)
await AppDataSource.manager.delete(User, 1);

// 方式2: 按条件删除
await AppDataSource.manager.delete(User, { firstName: "John" });

// 方式3: 使用 Repository
const userRepository = AppDataSource.getRepository(User);
await userRepository.delete(1);

// 方式4: 使用 Query Builder (最灵活)
await AppDataSource.createQueryBuilder()
    .delete()
    .from(User)
    .where("age > :age", { age: 30 })
    .execute();
```

## 总结

TypeORM 能自动识别主键是因为：

1. **装饰器元数据**：`@PrimaryGeneratedColumn()` 或 `@PrimaryColumn()` 标记了主键字段
2. **元数据存储**：这些信息在应用启动时被收集并存储
3. **智能解析**：`delete()` 方法会自动查找主键列，并用提供的值构建 WHERE 条件

这就是为什么 `delete(User, 1)` 会自动转换为 `DELETE FROM user WHERE id = 1`，而不是按照表中的行号删除。



# 元数据映射解析

### 1. 类作为"类型标识符"

在 TypeORM 中，类（如 `User`）主要起到以下作用：

```typescript
// User 类在这里不是实例，而是作为"类型标识符"
await AppDataSource.manager.save(User, [...])
await AppDataSource.manager.find(User)
await AppDataSource.manager.delete(User, 1)
```

TypeORM 使用类来：

- **识别操作哪个表**
- **获取实体的元数据**
- **进行类型推断**

### 2. 元数据驱动的工作原理

```typescript
// 当你调用这些方法时，TypeORM 内部做了什么：
await AppDataSource.manager.find(User)

// 内部执行流程：
// 1. 获取 User 类的元数据
const metadata = AppDataSource.getMetadata(User);
console.log(metadata.tableName); // "user"
console.log(metadata.columns);   // 所有列信息

// 2. 构建 SQL
const sql = `SELECT * FROM ${metadata.tableName}`;

// 3. 执行查询并将结果映射回 User 实例
const rawResults = await connection.query(sql);
const userInstances = rawResults.map(row => {
    const user = new User();
    user.id = row.id;
    user.firstName = row.firstName;
    // ... 其他字段
    return user;
});
```

### 3. 验证这个机制

你可以通过以下代码验证：

```typescript
AppDataSource.initialize().then(async () => {
    // 验证1：获取类的元数据
    const userMetadata = AppDataSource.getMetadata(User);
    console.log("表名:", userMetadata.tableName);
    console.log("列名:", userMetadata.columns.map(col => col.propertyName));
    
    // 验证2：TypeORM 如何识别不同的实体类
    console.log("所有已注册的实体:", 
        AppDataSource.entityMetadatas.map(meta => meta.name)
    );
    
    // 验证3：类构造函数作为标识符
    console.log("User 类名:", User.name); // "User"
    console.log("User 是否是构造函数:", typeof User === 'function'); // true
});
```

### 4. 类型安全的好处

这种设计带来了强大的类型安全：

```typescript
// TypeScript 知道返回的是 User 实例数组
const users: User[] = await AppDataSource.manager.find(User);

// 你可以安全地访问属性
users.forEach(user => {
    console.log(user.firstName); // TypeScript 知道这个属性存在
});

// 对比：如果返回的是 any[]，就失去了类型安全
```

### 5. 不同的使用模式对比

```typescript
// 模式1：直接传类（你在使用的方式）
await AppDataSource.manager.save(User, userData);

// 模式2：先创建实例再保存
const user = new User();
user.firstName = "John";
await AppDataSource.manager.save(user);

// 模式3：使用 Repository 模式
const userRepository = AppDataSource.getRepository(User);
await userRepository.save(userData);

// 模式4：使用 Active Record 模式（需要继承 BaseEntity）
class User extends BaseEntity {
    // ... 实体定义
}
const user = new User();
await user.save(); // 直接调用实例方法
```

### 6. 底层实现机制

TypeORM 的核心机制：

```typescript
// 简化的内部实现逻辑
class EntityManager {
    save<T>(entityClass: new () => T, entityData: any[]): Promise<T[]> {
        // 1. 通过类获取元数据
        const metadata = this.getMetadata(entityClass);
        
        // 2. 构建 SQL
        const sql = this.buildInsertSql(metadata, entityData);
        
        // 3. 执行 SQL
        const result = await this.connection.query(sql);
        
        // 4. 将结果映射为类实例
        return result.map(row => this.mapRowToEntity(entityClass, row));
    }
    
    private mapRowToEntity<T>(entityClass: new () => T, row: any): T {
        const instance = new entityClass(); // 这里创建了实例
        // 将数据库行数据映射到实例属性
        Object.assign(instance, row);
        return instance;
    }
}
```

## 总结

TypeORM 的设计不是传统的 IoC（控制反转），而是：

1. **元数据驱动**：通过装饰器收集类的结构信息
2. **类作为标识符**：使用类来识别要操作的表和数据结构
3. **自动映射**：在数据库记录和类实例之间自动转换
4. **类型安全**：利用 TypeScript 的类型系统提供编译时检查

这种设计让你可以用面向对象的方式操作数据库，同时保持类型安全和良好的开发体验。



# QueryBuilder

```typescript
  const query = queryBuilder.select('user.name', 'name')
    .addSelect('COUNT(post.id', 'count')
    .from(User, 'user')
    .leftJoin(Post, 'post', 'post.userId=user.id')
    .where('user.id=:id')
    .andWhere('post.isActive=:isActive')
    .setParameters({ id: 1, isActive: true })
    .groupBy('user.name')
    .having('COUNT(post.id)>:postCount', { postCount: 2 })

  const results = await query.getRawMany()
```

### 整体 SQL 构建流程

这段代码构建的最终 SQL 大致如下：

```sql
SELECT user.name as name, COUNT(post.id) as count
FROM user user
LEFT JOIN post post ON post.userId = user.id
WHERE user.id = 1 AND post.isActive = true
GROUP BY user.name
HAVING COUNT(post.id) > 2
```

### 逐步解析每个方法

```typescript
const queryBuilder = AppDataSource.createQueryBuilder()
```

- **作用**：创建一个空的查询构建器
- **类比**：就像拿了一张空白纸准备写 SQL

```typescript
.select('user.name', 'name')
```

- **作用**：选择要查询的字段
- **参数**：`('字段名', '别名')`
- **SQL 等价**：`SELECT user.name as name`

```typescript
.addSelect('COUNT(post.id)', 'count')
```

- **作用**：添加更多选择字段（不会覆盖之前的 select）
- **结果**：现在 SELECT 部分变成 `user.name as name, COUNT(post.id) as count`

```typescript
.from(User, 'user')
```

- **作用**：指定主表
- **参数**：`(实体类, '表别名')`
- **SQL 等价**：`FROM user user`

```typescript
.leftJoin(Post, 'post', 'post.userId=user.id')
```

- **作用**：左连接另一个表
- **参数**：`(实体类, '表别名', '连接条件')`
- **SQL 等价**：`LEFT JOIN post post ON post.userId = user.id`

```typescript
.where('user.id=:id')
```

- **作用**：添加 WHERE 条件
- **`:id`**：参数占位符，防止 SQL 注入
- **SQL 等价**：`WHERE user.id = ?`

```typescript
.andWhere('post.isActive=:isActive')
```

- **作用**：添加 AND 条件
- **结果**：`WHERE user.id = ? AND post.isActive = ?`

```typescript
.setParameters({ id: 1, isActive: true })
```

- **作用**：设置参数值
- **结果**：将 `:id` 替换为 1，`:isActive` 替换为 true

```typescript
.groupBy('user.name')
```

- **作用**：按字段分组
- **SQL 等价**：`GROUP BY user.name`

```typescript
.having('COUNT(post.id)>:postCount', { postCount: 2 })
```

- **作用**：添加 HAVING 条件（用于分组后的筛选）





# TypeORM事务机制

## 1. 事务基本概念

事务（Transaction）具有 ACID 特性：

- **原子性（Atomicity）**：所有操作要么全部成功，要么全部失败
- **一致性（Consistency）**：数据库从一个一致状态转换到另一个一致状态
- **隔离性（Isolation）**：并发事务之间相互隔离
- **持久性（Durability）**：提交后的更改永久保存

## 2. 代码解析

```typescript
await AppDataSource.manager.transaction(async manager => {
    await manager.save(User, {
      id: 4,
      firstName: 'eee',
      lastName: 'eee',
    })
})
```

**执行流程：**

1. 开始事务（BEGIN TRANSACTION）
2. 执行 save 操作
3. 如果成功：自动提交（COMMIT）
4. 如果失败：自动回滚（ROLLBACK）

## 3. TypeORM 事务的多种写法

```typescript
import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
import { Post } from "./entity/Post"
import { QueryRunner } from "typeorm"

AppDataSource.initialize().then(async () => {
    console.log("=== TypeORM 事务处理示例 ===\n")

    // ========== 方法1：manager.transaction（最常用） ==========
    console.log("1. 使用 manager.transaction（推荐）")
    
    try {
        const result = await AppDataSource.manager.transaction(async manager => {
            // 在事务中执行多个操作
            const user = await manager.save(User, {
                firstName: 'Transaction',
                lastName: 'User',
                age: 25,
                name: 'Transaction User'
            })
            
            // 为用户创建帖子
            const post1 = await manager.save(Post, {
                title: '事务测试帖子1',
                content: '这是在事务中创建的帖子',
                userId: user.id,
                isActive: true
            })
            
            const post2 = await manager.save(Post, {
                title: '事务测试帖子2',
                content: '这是在事务中创建的第二个帖子',
                userId: user.id,
                isActive: true
            })
            
            // 如果这里抛出错误，上面的所有操作都会回滚
            // throw new Error("模拟错误") // 取消注释测试回滚
            
            console.log("✅ 事务成功，创建了用户和2个帖子")
            return { user, posts: [post1, post2] }
        })
        
        console.log("事务结果:", result)
    } catch (error) {
        console.log("❌ 事务失败，所有操作已回滚:", error.message)
    }

    // ========== 方法2：Repository.transaction ==========
    console.log("\n2. 使用 Repository.transaction")
    
    const userRepository = AppDataSource.getRepository(User)
    const postRepository = AppDataSource.getRepository(Post)
    
    try {
        await userRepository.manager.transaction(async manager => {
            const userRepo = manager.getRepository(User)
            const postRepo = manager.getRepository(Post)
            
            const user = await userRepo.save({
                firstName: 'Repo',
                lastName: 'Transaction',
                age: 30,
                name: 'Repo Transaction'
            })
            
            await postRepo.save({
                title: 'Repository 事务帖子',
                content: '使用 Repository 方式的事务',
                userId: user.id,
                isActive: true
            })
            
            console.log("✅ Repository 事务成功")
        })
    } catch (error) {
        console.log("❌ Repository 事务失败:", error.message)
    }

    // ========== 方法3：手动控制事务（最灵活） ==========
    console.log("\n3. 手动控制事务（高级用法）")
    
    const queryRunner: QueryRunner = AppDataSource.createQueryRunner()
    
    // 建立连接
    await queryRunner.connect()
    
    // 开始事务
    await queryRunner.startTransaction()
    
    try {
        // 在事务中执行操作
        const user = await queryRunner.manager.save(User, {
            firstName: 'Manual',
            lastName: 'Transaction',
            age: 35,
            name: 'Manual Transaction'
        })
        
        const post = await queryRunner.manager.save(Post, {
            title: '手动事务帖子',
            content: '手动控制的事务操作',
            userId: user.id,
            isActive: true
        })
        
        // 手动提交事务
        await queryRunner.commitTransaction()
        console.log("✅ 手动事务提交成功")
        
    } catch (error) {
        // 发生错误时回滚事务
        await queryRunner.rollbackTransaction()
        console.log("❌ 手动事务回滚:", error.message)
    } finally {
        // 释放 query runner
        await queryRunner.release()
    }

    // ========== 方法4：嵌套事务（保存点） ==========
    console.log("\n4. 嵌套事务（Savepoint）")
    
    try {
        await AppDataSource.manager.transaction(async manager => {
            // 外层事务
            const user = await manager.save(User, {
                firstName: 'Nested',
                lastName: 'Transaction',
                age: 28,
                name: 'Nested Transaction'
            })
            
            try {
                // 内层事务（保存点）
                await manager.transaction(async nestedManager => {
                    await nestedManager.save(Post, {
                        title: '嵌套事务帖子',
                        content: '这是嵌套事务中的操作',
                        userId: user.id,
                        isActive: true
                    })
                    
                    // 模拟内层事务失败
                    // throw new Error("内层事务错误")
                })
                
                console.log("✅ 嵌套事务全部成功")
            } catch (error) {
                console.log("⚠️ 内层事务失败，但外层事务继续:", error.message)
                // 外层事务可以继续执行其他操作
            }
        })
    } catch (error) {
        console.log("❌ 外层事务失败:", error.message)
    }

    // ========== 5. 事务隔离级别 ==========
    console.log("\n5. 事务隔离级别")
    
    try {
        await AppDataSource.manager.transaction(
            "READ COMMITTED",  // 隔离级别
            async manager => {
                const users = await manager.find(User)
                console.log(`✅ 在 READ COMMITTED 隔离级别下查询到 ${users.length} 个用户`)
            }
        )
    } catch (error) {
        console.log("❌ 隔离级别事务失败:", error.message)
    }

    // ========== 6. 实际业务场景示例：转账操作 ==========
    console.log("\n6. 实际业务场景：模拟转账操作")
    
    // 假设我们有一个账户余额字段（这里用 age 字段模拟余额）
    async function transferMoney(fromUserId: number, toUserId: number, amount: number) {
        return await AppDataSource.manager.transaction(async manager => {
            // 查询转出账户
            const fromUser = await manager.findOne(User, { where: { id: fromUserId } })
            if (!fromUser) throw new Error("转出账户不存在")
            if (fromUser.age < amount) throw new Error("余额不足")
            
            // 查询转入账户
            const toUser = await manager.findOne(User, { where: { id: toUserId } })
            if (!toUser) throw new Error("转入账户不存在")
            
            // 执行转账操作
            fromUser.age -= amount  // 减少余额
            toUser.age += amount    // 增加余额
            
            // 保存更改
            await manager.save([fromUser, toUser])
            
            console.log(`✅ 转账成功：用户${fromUserId} -> 用户${toUserId}，金额：${amount}`)
            return { fromUser, toUser, amount }
        })
    }
    
    try {
        // 假设用户1向用户2转账10元（这里用age字段模拟）
        // await transferMoney(1, 2, 10)
        console.log("转账功能已准备就绪（需要实际用户数据）")
    } catch (error) {
        console.log("❌ 转账失败:", error.message)
    }

    // ========== 7. 事务性能监控 ==========
    console.log("\n7. 事务性能监控")
    
    const startTime = Date.now()
    try {
        await AppDataSource.manager.transaction(async manager => {
            // 模拟一些数据库操作
            const users = await manager.find(User, { take: 5 })
            console.log(`事务中查询到 ${users.length} 个用户`)
        })
        
        const endTime = Date.now()
        console.log(`✅ 事务执行时间: ${endTime - startTime}ms`)
    } catch (error) {
        console.log("❌ 性能监控事务失败:", error.message)
    }

}).catch(error => console.log("数据库连接错误:", error))
```

## 4. 事务的关键概念

### 事务隔离级别

```typescript
// 可用的隔离级别
await AppDataSource.manager.transaction(
    "READ UNCOMMITTED" | "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE",
    async manager => {
        // 事务操作
    }
)
```

### 错误处理机制

```typescript
await AppDataSource.manager.transaction(async manager => {
    try {
        // 业务操作
        await manager.save(User, userData)
        await manager.save(Post, postData)
    } catch (error) {
        // 这里的错误会导致整个事务回滚
        throw error  // 重新抛出以确保事务回滚
    }
})
```

## 5. 使用场景和最佳实践

### ✅ 适合使用事务的场景：

1. **转账操作**：确保扣款和入账同时成功
2. **订单创建**：创建订单 + 减库存 + 创建支付记录
3. **用户注册**：创建用户 + 发送邮件 + 记录日志
4. **数据迁移**：批量数据修改操作

### ⚠️ 事务使用注意事项：

1. **事务要尽可能短**：长事务会锁定资源
2. **避免在事务中调用外部API**：可能导致超时
3. **正确处理异常**：确保错误时能正确回滚
4. **生产环境慎用嵌套事务**：增加复杂性

### 🎯 选择事务方法的建议：

- **简单场景**：使用 `manager.transaction()`
- **需要精确控制**：使用手动 QueryRunner
- **复杂业务逻辑**：使用 Repository 事务
- **性能敏感**：避免不必要的事务
