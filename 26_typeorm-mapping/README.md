# TypeORM命令解析

```typescript
npx typeorm entity:create src/entity/IdCard
```

### 命令组成部分：

- **`npx`**：Node.js 包执行器，用于执行本地安装的包命令
- **`typeorm`**：TypeORM CLI 工具
- **`entity:create`**：创建实体的子命令
- **`src/entity/IdCard`**：目标路径和实体名称

## 2. 执行结果

这个命令会在 `src/entity/` 目录下创建一个名为 `IdCard.ts` 的文件：

```typescript
import { Entity } from "typeorm"

@Entity()
export class IdCard {

}
```

我们来继续完善一下这个entity:
IdCard:

```ts
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./User"

@Entity({
  name: 'id_card'
})
export class IdCard {
  @PrimaryGeneratedColumn()
  id: number

  @Column({
    length: 50,
    comment: '身份证号'
  })
  cardName: string


  @JoinColumn()
  @OneToOne(() => User)
  user: User
}

```

User:
```ts
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

### 代码分析

```typescript
@JoinColumn()
@OneToOne(() => User)
user: User
```

这段代码的含义：

- **`@OneToOne(() => User)`**：声明与 User 实体的一对一关系
- **`@JoinColumn()`**：指定这一方持有外键（拥有方）
- **`user: User`**：关系属性，类型为 User 实体

## 一对一关系的完整实现

```typescript
// ========== 一对一关系的两种实现方式 ==========

// 方式1：单向一对一关系（你当前的实现）
// IdCard.ts - 拥有方（Owner Side）
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./User"

@Entity({ name: 'id_card' })
export class IdCard {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        length: 50,
        comment: '身份证号'
    })
    cardName: string

    // 关键：@JoinColumn() 表示这一方持有外键
    @JoinColumn({ name: 'user_id' })  // 可以指定外键列名
    @OneToOne(() => User)
    user: User
}

// User.ts - 被引用方
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
    
    // 注意：User 这边没有对 IdCard 的引用
    // 这就是单向关系
}

// ========================================

// 方式2：双向一对一关系（推荐）
// IdCard.ts - 拥有方（Owner Side）
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./User"

@Entity({ name: 'id_card' })
export class IdCard {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        length: 18,
        unique: true,
        comment: '身份证号'
    })
    cardNumber: string

    @Column({
        length: 50,
        comment: '真实姓名'
    })
    realName: string

    // 双向关系：指定反向属性
    @JoinColumn({ name: 'user_id' })
    @OneToOne(() => User, user => user.idCard)  // 关键：指定反向属性
    user: User
}

// User.ts - 被引用方（Inverse Side）
import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from "typeorm"
import { IdCard } from "./IdCard"

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

    // 双向关系：不使用 @JoinColumn()
    @OneToOne(() => IdCard, idCard => idCard.user)
    idCard: IdCard
}

// ========================================

// 方式3：完整的业务实现（推荐用于生产环境）
// IdCard.ts - 完整版本
import { 
    Column, 
    Entity, 
    JoinColumn, 
    OneToOne, 
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index
} from "typeorm"
import { User } from "./User"

@Entity({ name: 'id_cards' })
@Index(['cardNumber'], { unique: true })  // 添加唯一索引
export class IdCard {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        name: 'card_number',
        length: 18,
        unique: true,
        comment: '身份证号码'
    })
    cardNumber: string

    @Column({
        name: 'real_name',
        length: 50,
        comment: '真实姓名'
    })
    realName: string

    @Column({
        name: 'birth_date',
        type: 'date',
        comment: '出生日期'
    })
    birthDate: Date

    @Column({
        length: 10,
        comment: '性别'
    })
    gender: string

    @Column({
        type: 'text',
        comment: '地址'
    })
    address: string

    @Column({
        name: 'is_valid',
        type: 'boolean',
        default: true,
        comment: '是否有效'
    })
    isValid: boolean

    // 一对一关系配置
    @JoinColumn({ 
        name: 'user_id',           // 外键列名
        referencedColumnName: 'id' // 引用的列名（默认是主键）
    })
    @OneToOne(() => User, user => user.idCard, {
        cascade: ['insert', 'update'],  // 级联操作
        onDelete: 'CASCADE',            // 删除用户时删除身份证
        nullable: false,                // 外键不能为空
        eager: false                    // 不自动加载关联数据
    })
    user: User

    @CreateDateColumn({
        name: 'created_at',
        comment: '创建时间'
    })
    createdAt: Date

    @UpdateDateColumn({
        name: 'updated_at', 
        comment: '更新时间'
    })
    updatedAt: Date

    // 业务方法
    getAge(): number {
        const today = new Date()
        const birthDate = new Date(this.birthDate)
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        
        return age
    }

    isExpired(): boolean {
        // 身份证有效期验证逻辑
        return false  // 简化实现
    }
}

// User.ts - 完整版本
import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    OneToOne,
    CreateDateColumn,
    UpdateDateColumn
} from "typeorm"
import { IdCard } from "./IdCard"

@Entity({ name: 'users' })
export class UserComplete {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        name: 'first_name',
        length: 50
    })
    firstName: string

    @Column({
        name: 'last_name', 
        length: 50
    })
    lastName: string

    @Column({
        type: 'int',
        unsigned: true
    })
    age: number

    @Column({
        length: 100,
        unique: true,
        comment: '邮箱'
    })
    email: string

    @Column({
        name: 'phone_number',
        length: 20,
        nullable: true,
        comment: '手机号'
    })
    phoneNumber?: string

    // 一对一关系 - 不使用 @JoinColumn()
    @OneToOne(() => IdCard, idCard => idCard.user, {
        cascade: true,    // 级联操作
        eager: false,     // 不自动加载
        nullable: true    // 可以没有身份证
    })
    idCard?: IdCard

    @CreateDateColumn({
        name: 'created_at'
    })
    createdAt: Date

    @UpdateDateColumn({
        name: 'updated_at'
    })
    updatedAt: Date

    // 业务方法
    getFullName(): string {
        return `${this.firstName} ${this.lastName}`
    }

    isVerified(): boolean {
        return !!this.idCard && this.idCard.isValid
    }

    getRealName(): string {
        return this.idCard?.realName || this.getFullName()
    }
}
```



##  关键概念详解

### `@JoinColumn()` 的作用

```typescript
@JoinColumn()  // 简单用法
@JoinColumn({ name: 'user_id' })  // 指定外键列名
@JoinColumn({ 
    name: 'user_id',           // 外键列名
    referencedColumnName: 'id' // 引用的目标列（通常是主键）
})
```

**重要原则**：

- **只有拥有方（Owner Side）使用 `@JoinColumn()`**
- **拥有方的表中会创建外键列**
- **被引用方（Inverse Side）不使用 `@JoinColumn()`**

### 数据库表结构

代码会生成以下表结构：

```sql
-- id_card 表（拥有方）
CREATE TABLE id_card (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cardName VARCHAR(50) COMMENT '身份证号',
    user_id INT,                    -- 外键列
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- user 表（被引用方）
CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    firstName VARCHAR(255),
    lastName VARCHAR(255),
    age INT
);
```

##  一对一关系的配置选项

### `@OneToOne()` 配置选项

```typescript
@OneToOne(() => User, user => user.idCard, {
    cascade: ['insert', 'update'],  // 级联操作
    onDelete: 'CASCADE',            // 删除策略
    onUpdate: 'CASCADE',            // 更新策略
    nullable: false,                // 是否可为空
    eager: false,                   // 是否自动加载
    lazy: false,                    // 是否懒加载
    orphanedRowAction: 'delete'     // 孤立行处理
})
```

### `@JoinColumn()` 配置选项

```typescript
@JoinColumn({
    name: 'user_id',                // 外键列名
    referencedColumnName: 'id',     // 引用的列名
    foreignKeyConstraintName: 'FK_idcard_user'  // 外键约束名
})
```

### 执行级联操作

```typescript
import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
import { IdCard } from "./entity/IdCard"

AppDataSource.initialize().then(async () => {

  console.log("Inserting a new user with IdCard into the database...")

  // 先创建 IdCard
  const idCard = new IdCard()
  idCard.cardNumber = "123456789012345678"
  idCard.realName = "Timber Saw"

  // 创建 User 并关联 IdCard
  const user = new User()
  user.firstName = "Timber"
  user.lastName = "Saw"
  user.age = 25

  // 建立关联
  idCard.user = user
  user.idCard = idCard

  // 保存 IdCard（由于配置了级联，User 也会被保存）
  await AppDataSource.manager.save(idCard)
  console.log("Saved user and IdCard")

  console.log("Loading users from the database...")
  const users = await AppDataSource.manager.find(User)
  console.log("Loaded users: ", users)

  // 加载用户及其身份证信息
  console.log("Loading users with IdCard...")
  const usersWithIdCard = await AppDataSource.manager.find(User, {
    relations: ["idCard"]
  })
  console.log("Loaded users with IdCard: ", usersWithIdCard)

  console.log("Here you can setup and run express / fastify / any other framework.")

}).catch(error => console.log(error))

```



## 最佳实践

### ✅ 推荐做法：

1. **使用双向关系**：便于从两个方向查询
2. **明确拥有方**：将外键放在逻辑上"从属"的实体中
3. **合理使用级联**：避免意外的数据删除
4. **添加索引**：为外键列创建索引提高查询性能

### ⚠️ 注意事项：

1. **外键约束**：确保数据的引用完整性
2. **循环依赖**：避免实体间的循环引用
3. **查询性能**：按需加载关联数据，避免 N+1 问题
4. **事务处理**：复杂操作使用事务保证数据一致性





## 级联关系的核心原理

### 1. 配置分析

如果在 IdCard 实体配置把cascade设置为true：

```typescript
@OneToOne(() => User, {
    cascade: true,           // 启用所有级联操作
    onDelete: 'CASCADE',     // 删除级联
    onUpdate: 'CASCADE'      // 更新级联
})
user: User
```

### 2. 级联工作流程

```typescript
// ========== 级联关系工作机制详解 ==========

// 你的 IdCard 实体配置
@Entity({ name: 'id_card' })
export class IdCard {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        length: 50,
        comment: '身份证号'
    })
    cardName: string

    @JoinColumn()
    @OneToOne(() => User, {
        cascade: true,           // 🔥 关键：启用级联
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })
    user: User
}

// ========== 级联的工作流程 ==========

AppDataSource.initialize().then(async () => {
    console.log("=== 级联关系工作机制演示 ===\n")

    // 📝 情况1：没有级联时需要分别保存
    console.log("1. 没有级联时的操作（需要两次保存）")
    
    // 先保存 User
    const user1 = new User()
    user1.firstName = 'zhang'
    user1.lastName = 'san'
    user1.age = 25
    const savedUser1 = await AppDataSource.manager.save(user1)  // 👈 必须先保存User
    console.log("✅ User 已保存, ID:", savedUser1.id)

    // 再保存 IdCard
    const idCard1 = new IdCard()
    idCard1.cardName = '1111111'
    idCard1.user = savedUser1  // 关联已保存的User
    await AppDataSource.manager.save(idCard1)  // 👈 再保存IdCard
    console.log("✅ IdCard 已保存, ID:", idCard1.id)

    // 📝 情况2：有级联时只需保存一次
    console.log("\n2. 有级联时的操作（只需一次保存）")
    
    // 创建 User（还没保存）
    const user2 = new User()
    user2.firstName = 'li'
    user2.lastName = 'si'
    user2.age = 30
    console.log("📋 User 创建但未保存, ID:", user2.id)  // undefined

    // 创建 IdCard 并关联 User
    const idCard2 = new IdCard()
    idCard2.cardName = '2222222'
    idCard2.user = user2  // 👈 关联未保存的User
    
    // 只保存 IdCard，User 会自动被保存
    await AppDataSource.manager.save(idCard2)  // 🔥 级联保存！
    console.log("✅ 级联保存完成!")
    console.log("   - IdCard ID:", idCard2.id)
    console.log("   - User ID:", user2.id)  // 👈 现在有值了！

    // ========== 级联类型详解 ==========
    console.log("\n=== 级联类型详解 ===")

    // cascade: true 等价于所有类型
    // cascade: ['insert', 'update', 'remove', 'soft-remove', 'recover']

    // 具体的级联类型示例：
    
    // 📝 insert 级联：保存父实体时自动保存子实体
    console.log("\n3. insert 级联演示")
    @Entity()
    class UserWithInsertCascade {
        @PrimaryGeneratedColumn()
        id: number
        
        @Column()
        name: string
        
        @OneToOne(() => IdCard, {
            cascade: ['insert']  // 只在插入时级联
        })
        idCard: IdCard
    }

    // 📝 update 级联：更新父实体时自动更新子实体
    console.log("\n4. update 级联演示")
    
    // 修改 User 信息
    user2.firstName = '李四_修改'
    await AppDataSource.manager.save(idCard2)  // 保存IdCard时会级联更新User
    console.log("✅ 级联更新完成")
    
    // 验证更新
    const updatedUser = await AppDataSource.manager.findOne(User, { 
        where: { id: user2.id } 
    })
    console.log("更新后的用户名:", updatedUser?.firstName)

    // 📝 remove 级联：删除父实体时自动删除子实体
    console.log("\n5. remove 级联演示")
    
    // 注意：这里要小心，真正删除数据
    console.log("⚠️ remove 级联会真正删除数据，此处仅演示概念")
    
    // await AppDataSource.manager.remove(idCard2)  // 会级联删除关联的User
    // console.log("级联删除完成")

    // ========== 级联 vs 数据库外键约束 ==========
    console.log("\n=== 级联 vs 数据库外键约束 ===")
    
    console.log("🔍 TypeORM 级联 (cascade):")
    console.log("   - 应用层面的自动操作")
    console.log("   - 由 TypeORM 代码控制")
    console.log("   - 可以精确控制哪些操作级联")
    
    console.log("\n🔍 数据库外键约束 (onDelete/onUpdate):")
    console.log("   - 数据库层面的约束")
    console.log("   - 由数据库引擎强制执行") 
    console.log("   - CASCADE/RESTRICT/SET NULL 等选项")

    // ========== 实际业务场景 ==========
    console.log("\n=== 实际业务场景建议 ===")
    
    // 场景1：用户注册（创建用户 + 创建资料）
    console.log("\n📋 场景1：用户注册")
    const registerUser = async (userData: any, profileData: any) => {
        const user = new User()
        Object.assign(user, userData)
        
        const profile = new IdCard()
        Object.assign(profile, profileData)
        profile.user = user
        
        // 只需要保存一个实体，另一个会级联保存
        return await AppDataSource.manager.save(profile)
    }
    
    // 场景2：批量操作
    console.log("\n📋 场景2：批量操作")
    const createMultipleUsersWithProfiles = async () => {
        const entities = []
        
        for (let i = 0; i < 3; i++) {
            const user = new User()
            user.firstName = `User${i}`
            user.lastName = `Last${i}`
            user.age = 20 + i
            
            const idCard = new IdCard()
            idCard.cardName = `ID${i}${i}${i}${i}${i}${i}${i}`
            idCard.user = user
            
            entities.push(idCard)
        }
        
        // 批量保存，所有User都会级联保存
        await AppDataSource.manager.save(entities)
        console.log("✅ 批量级联保存完成")
    }
    
    await createMultipleUsersWithProfiles()

    // ========== 级联的注意事项 ==========
    console.log("\n=== 级联使用注意事项 ===")
    
    console.log("✅ 优点：")
    console.log("   - 减少代码重复")
    console.log("   - 确保数据一致性") 
    console.log("   - 简化业务逻辑")
    
    console.log("\n⚠️ 注意事项：")
    console.log("   - 可能产生意外的数据操作")
    console.log("   - 性能影响（额外的数据库操作）")
    console.log("   - 调试困难（隐式操作）")
    console.log("   - 级联删除风险高")
    
    console.log("\n🎯 最佳实践：")
    console.log("   - insert/update 级联相对安全")
    console.log("   - remove 级联要特别谨慎")
    console.log("   - 明确业务逻辑再配置级联")
    console.log("   - 生产环境建议使用事务")

    // ========== 性能对比 ==========
    console.log("\n=== 性能对比 ===")
    
    console.log("手动保存 vs 级联保存的执行情况：")
    
    const startTime1 = Date.now()
    // 手动保存（2次数据库操作）
    const manualUser = new User()
    manualUser.firstName = 'Manual'
    manualUser.lastName = 'Save'
    manualUser.age = 25
    await AppDataSource.manager.save(manualUser)
    
    const manualIdCard = new IdCard()
    manualIdCard.cardName = 'Manual123'
    manualIdCard.user = manualUser
    await AppDataSource.manager.save(manualIdCard)
    const time1 = Date.now() - startTime1
    
    const startTime2 = Date.now()
    // 级联保存（1次调用，内部可能2次操作）
    const cascadeUser = new User()
    cascadeUser.firstName = 'Cascade'
    cascadeUser.lastName = 'Save'
    cascadeUser.age = 26
    
    const cascadeIdCard = new IdCard()
    cascadeIdCard.cardName = 'Cascade123'
    cascadeIdCard.user = cascadeUser
    await AppDataSource.manager.save(cascadeIdCard)
    const time2 = Date.now() - startTime2
    
    console.log(`手动保存耗时: ${time1}ms`)
    console.log(`级联保存耗时: ${time2}ms`)
    console.log("💡 级联保存简化了代码但不一定更快")

}).catch(error => console.log("错误:", error))
```

## 3.关键点总结

### 🔥 为什么设置级联后不需要手动保存 User？

1. **自动传播**：当你保存 IdCard 时，TypeORM 检测到 `cascade: true`
2. **依赖检查**：发现 `idCard.user` 是一个未保存的实体（id 为 undefined）
3. **自动保存**：TypeORM 自动先保存 User，获得 ID 后再保存 IdCard
4. **关系建立**：自动设置外键关系

### 📊 执行顺序

```typescript
// 你的代码执行时的内部流程：
await AppDataSource.manager.save(idCard);

// TypeORM 内部实际执行：
// 1. 检查 idCard.user 是否需要保存
// 2. 发现 user.id 是 undefined（未保存）
// 3. 先执行：INSERT INTO user (...) VALUES (...)
// 4. 获取 user.id = 新生成的ID
// 5. 再执行：INSERT INTO id_card (..., user_id) VALUES (..., user.id)
```

### ⚠️ 重要注意事项

1. **级联方向**：只有拥有 `cascade` 配置的实体才会触发级联
2. **性能考虑**：级联可能产生额外的数据库查询
3. **事务安全**：建议在事务中使用级联操作
4. **调试困难**：级联操作是隐式的，可能难以追踪

### 🎯 最佳实践建议

```typescript
// 推荐：明确指定需要的级联类型
@OneToOne(() => User, {
    cascade: ['insert', 'update'],  // 只在插入和更新时级联
    onDelete: 'CASCADE'             // 数据库层面的删除级联
})
user: User

// 避免：盲目使用 cascade: true
@OneToOne(() => User, {
    cascade: true  // 包含 remove，可能误删数据
})
```

总结：级联关系让 TypeORM 自动管理关联实体的生命周期，减少了手动保存的代码，但需要谨慎使用以避免意外的数据操作！





# 查询语句

我们一般有多种方式进行查询，重点讲一下查询方式二：
```typescript
  /* 查询方法 */
  // 方案一：使用 relations 查询
  const ics = await AppDataSource.manager.find(IdCard, {
    relations: ["user"]
  });
  console.log('ics', ics);

  // 方案二：使用query builder查询
  const ics2 = await AppDataSource.manager.getRepository(IdCard)
    .createQueryBuilder("ic")
    .leftJoinAndSelect("ic.user", "u")
    .getMany();

  console.log(ics2);

```

### 执行步骤：

1. **获取 Repository**：`getRepository(IdCard)`
2. **创建查询构建器**：`createQueryBuilder("ic")`
3. **左连接并选择**：`leftJoinAndSelect("ic.user", "u")`
4. **执行查询**：`getMany()`
5. **输出结果**：`console.log(ics)`

### 详细功能讲解

```typescript
// ========== 不同查询方法的结果对比 ==========

// 方法1： leftJoinAndSelect
const method1 = await AppDataSource.getRepository(IdCard)
    .createQueryBuilder("ic")
    .leftJoinAndSelect("ic.user", "u")
    .getMany();
// 结果：IdCard 实体数组，每个包含完整的 user 对象
// SQL: SELECT ic.*, u.* FROM id_card ic LEFT JOIN user u ON ic.user_id = u.id

// 方法2：只使用 leftJoin（不选择关联数据）
const method2 = await AppDataSource.getRepository(IdCard)
    .createQueryBuilder("ic")
    .leftJoin("ic.user", "u")
    .getMany();
// 结果：IdCard 实体数组，但 user 属性为 undefined
// SQL: SELECT ic.* FROM id_card ic LEFT JOIN user u ON ic.user_id = u.id

// 方法3：使用 find + relations
const method3 = await AppDataSource.getRepository(IdCard).find({
    relations: ["user"]
});
// 结果：与 method1 相同，但语法更简单
// SQL: 可能是两次查询或一次 LEFT JOIN

// 方法4：innerJoinAndSelect（只返回有关联的记录）
const method4 = await AppDataSource.getRepository(IdCard)
    .createQueryBuilder("ic")
    .innerJoinAndSelect("ic.user", "u")
    .getMany();
// 结果：只包含有关联用户的 IdCard
// SQL: SELECT ic.*, u.* FROM id_card ic INNER JOIN user u ON ic.user_id = u.id

// 方法5：分别查询
const idCards = await AppDataSource.getRepository(IdCard).find();
const userIds = idCards.map(ic => ic.userId).filter(Boolean);
const users = await AppDataSource.getRepository(User).findByIds(userIds);
// 结果：需要手动组装数据
// SQL: 两次独立查询

// ========== 性能和使用场景对比 ==========

console.log(`
📊 方法对比：

方法1 - leftJoinAndSelect（你使用的）：
✅ 一次查询获取所有数据
✅ 包含所有 IdCard（即使没有关联用户）
✅ 数据结构完整，使用方便
❌ 数据量大时可能冗余

方法2 - leftJoin：
✅ 可以在 WHERE 中使用关联表条件
❌ 不包含关联数据，需要额外查询

方法3 - find + relations：
✅ 语法简单
✅ TypeORM 自动优化查询
❌ 灵活性有限

方法4 - innerJoinAndSelect：
✅ 数据量更少（只有有关联的记录）
❌ 可能遗漏数据

方法5 - 分别查询：
✅ 精确控制查询
✅ 避免重复数据
❌ 代码复杂，可能产生 N+1 问题
`)

// ========== 使用建议 ==========

console.log(`
🎯 使用建议：

简单关联查询 → find({ relations: ["user"] })
复杂条件查询 → leftJoinAndSelect  👈 你的选择
需要所有记录 → leftJoinAndSelect
只要有关联的 → innerJoinAndSelect
性能敏感场景 → 分别查询 + 手动组装
聚合统计查询 → leftJoin + select
`)
```

## 3. 核心概念总结

### `leftJoinAndSelect` 的作用

1. **`leftJoin`**：连接表，可以在 WHERE 条件中使用
2. **`AndSelect`**：选择连接表的字段到结果中
3. **组合效果**：既连接又获取关联数据

### 查询结果结构

你的代码返回的 `ics` 数组结构如下：

```typescript
// 返回结果示例
[
  {
    id: 1,
    cardName: "1111111",
    user: {                    // 👈 因为 leftJoinAndSelect 才有这个对象
      id: 1,
      firstName: "guang",
      lastName: "guang", 
      age: 20
    }
  },
  {
    id: 2,
    cardName: "2222222", 
    user: null               // 👈 LEFT JOIN 的特点：即使没有关联用户也会返回
  }
]
```

### getMany() 执行的查询机制

#### 内部工作流程

```typescript
.getMany()  // 执行步骤：
```

1. **构建 SQL**：将 QueryBuilder 转换为 SQL 语句
2. **执行查询**：发送 SQL 到数据库
3. **获取结果**：接收数据库返回的原始数据
4. **数据映射**：将原始数据转换为 TypeScript 实体对象
5. **关系组装**：根据 `leftJoinAndSelect` 组装关联对象

# TypeORM 查询方法对比表

## 基础查询方法

| 方法           | 返回类型             | 记录数量 | 数据格式 | 使用场景                 |
| -------------- | -------------------- | -------- | -------- | ------------------------ |
| `getMany()`    | `Entity[]`           | 多条     | 实体对象 | 获取多个实体，可调用方法 |
| `getOne()`     | `Entity | null`      | 单条     | 实体对象 | 获取单个实体             |
| `getRawMany()` | `Object[]`           | 多条     | 原始对象 | 性能优先，纯数据显示     |
| `getRawOne()`  | `Object | undefined` | 单条     | 原始对象 | 获取单条原始数据         |

## 统计和分页方法

| 方法                  | 返回类型                              | 查询次数 | 使用场景               |
| --------------------- | ------------------------------------- | -------- | ---------------------- |
| `getCount()`          | `number`                              | 1次      | 只需要数量统计         |
| `getManyAndCount()`   | `[Entity[], number]`                  | 1次      | 分页查询（推荐）       |
| `getRawAndEntities()` | `{entities: Entity[], raw: Object[]}` | 1次      | 同时需要实体和原始数据 |

## 特殊查询方法

| 方法        | 返回类型         | 特点     | 使用场景        |
| ----------- | ---------------- | -------- | --------------- |
| `stream()`  | `ReadableStream` | 流式处理 | 大数据量处理    |
| `execute()` | `any`            | 原始执行 | 复杂 SQL 或 DDL |

## 实际示例对比

### getMany() 示例

```typescript
const result = await repository
    .createQueryBuilder("ic")
    .leftJoinAndSelect("ic.user", "u")
    .getMany();
// 结果：[IdCard{ id: 1, cardName: "123", user: User{...} }]
// 可以调用：result[0].user.getFullName()
```

### getRawMany() 示例

```typescript
const result = await repository
    .createQueryBuilder("ic")  
    .leftJoinAndSelect("ic.user", "u")
    .getRawMany();
// 结果：[{ ic_id: 1, ic_cardName: "123", u_id: 1, u_firstName: "John" }]
// 无法调用实体方法
```

### getManyAndCount() 示例

```typescript
const [data, total] = await repository
    .createQueryBuilder("ic")
    .leftJoinAndSelect("ic.user", "u")
    .limit(10)
    .getManyAndCount();
// 结果：[[IdCard, IdCard, ...], 25]
// 一次查询获得数据和总数
```

## 性能建议

| 场景         | 推荐方法            | 原因                     |
| ------------ | ------------------- | ------------------------ |
| 业务逻辑处理 | `getMany()`         | 可调用实体方法，类型安全 |
| 纯数据展示   | `getRawMany()`      | 性能更好，内存占用少     |
| 分页列表     | `getManyAndCount()` | 一次查询获取数据和总数   |
| 大数据处理   | `stream()`          | 避免内存溢出             |
| 只需统计     | `getCount()`        | 最快的统计方式           |

## 常见错误

❌ **错误用法：**

```typescript
// 1. 忘记 await
const result = repository.createQueryBuilder().getMany(); // Promise<Entity[]>

// 2. 在 getRawMany 结果上调用实体方法
const raw = await repository.createQueryBuilder().getRawMany();
raw[0].getFullName(); // ❌ 错误！原始对象没有方法

// 3. 大数据量使用 getMany()
const huge = await repository.createQueryBuilder().getMany(); // ❌ 可能内存溢出
```

✅ **正确用法：**

```typescript
// 1. 始终使用 await
const result = await repository.createQueryBuilder().getMany();

// 2. 原始数据直接访问属性
const raw = await repository.createQueryBuilder().getRawMany();
console.log(raw[0].ic_cardName); // ✅ 正确

// 3. 大数据使用分页或流
const [data, total] = await repository.createQueryBuilder()
    .limit(100).getManyAndCount(); // ✅ 分页
```
