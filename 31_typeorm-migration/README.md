# Migration 的"安全性"

Migration 比 `synchronize: true` 安全，但这是**相对安全**，不是绝对安全。

### synchronize 的危险：

```typescript
// 每次应用启动都会自动执行，无法控制
synchronize: true  // 重启 = 自动对比 = 可能删除数据
```

### migration 的相对安全：

```typescript
// 需要人工执行，可以控制时机
npm run migration:run  // 手动执行，可以选择不执行
```

## Migration 提供的"安全机制"

### 1. **可预览**

```bash
# 生成 migration 后，可以先检查
cat src/migration/1705300000000-RemoveEmail.ts

# 看到危险操作可以选择不执行
export class RemoveEmail {
  async up() {
    await queryRunner.query(`DROP COLUMN email`);  // 发现这很危险！
  }
}
```

### 2. **可审查**

```bash
# migration 文件可以被代码审查
git diff  # 团队可以看到要执行什么 SQL
```

### 3. **可回滚**

```typescript
export class RemoveEmail {
  async up() {
    await queryRunner.query(`DROP COLUMN email`);
  }
  
  async down() {
    // 提供回滚机制（虽然数据可能已经丢失）
    await queryRunner.query(`ADD COLUMN email VARCHAR(255)`);
  }
}
```

### 4. **分环境测试**

```bash
# 可以先在测试环境验证
npm run migration:run  # 测试环境先试
# 确认没问题再在生产环境执行
```

## 但 Migration 仍然很危险

Migration 执行删除操作时同样会丢失数据：

```sql
-- 这个 SQL 不管是 synchronize 还是 migration 执行，数据都会丢失
DROP COLUMN email;
```

## 真正的安全来自流程

### 1. **人工审核**

```
所有删除操作的 migration 都需要：
- DBA 审核
- 架构师审核  
- 测试环境验证
- 生产环境慎重执行
```

### 2. **分步执行**

```typescript
// 不生成删除操作，而是分步进行
// 第1步：停止使用字段
// 第2步：重命名为 deprecated
// 第3步：几个月后再删除
```

### 3. **备份策略**

```bash
# 执行危险 migration 前
mysqldump database > backup.sql
npm run migration:run
```

## 总结

Migration 不是因为"安全"而推荐，而是因为：

1. **可控性** - 可以选择执行时机
2. **可见性** - 可以看到要执行什么操作
3. **可审查** - 团队可以审核危险操作
4. **一致性** - 保证所有环境执行相同操作

但最终，**删除数据的操作本身就是危险的**，不管用什么工具执行。

真正的安全依赖于：

- 严格的审核流程
- 充分的备份机制
- 谨慎的操作原则（优先新增，避免删除）

Migration 只是让这个危险操作变得可控和可追踪，而不是让它变得绝对安全。

# 为什么 Migration 命令这么复杂？

### 1. **历史原因和工具限制**

```bash
# 你看到的复杂命令
npx ts-node ./node_modules/typeorm/cli migration:create ./src/migration/Aaa

# 为什么这么复杂？
npx           # Node 包执行器
ts-node       # TypeScript 直接执行器（因为 TypeORM CLI 是 TS 写的）
./node_modules/typeorm/cli  # TypeORM CLI 的实际位置
migration:create            # 具体的命令
./src/migration/Aaa        # 输出路径和文件名
```

### 2. **现代化的解决方案**

其实有更简单的方法：

#### 方法1：使用 package.json scripts

```json
{
  "scripts": {
    "migration:create": "typeorm migration:create",
    "migration:generate": "typeorm migration:generate -d src/data-source.ts",
    "migration:run": "typeorm migration:run -d src/data-source.ts",
    "migration:revert": "typeorm migration:revert -d src/data-source.ts"
  }
}
```

然后就可以简单使用：

```bash
npm run migration:create src/migration/AddUser
npm run migration:generate src/migration/UpdateUser
npm run migration:run
```

#### 方法2：创建数据源文件

```typescript
// src/data-source.ts
import { DataSource } from 'typeorm';
import { User } from './user/entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  database: 'test',
  synchronize: false,
  logging: false,
  entities: [User],
  migrations: ['src/migration/*.ts'],
  subscribers: ['src/subscriber/*.ts'],
});
```

#### 方法3：使用 NestJS CLI（推荐）

NestJS 现在提供了更简单的方式：

```bash
# 安装 NestJS CLI
npm i -g @nestjs/cli

# 使用 NestJS 命令
nest g resource user  # 自动生成 entity, service, controller 等
```

### 3. **为什么命令复杂的技术原因**

```bash
# 完整命令解析
npx ts-node ./node_modules/typeorm/cli migration:create ./src/migration/Aaa

# 1. npx：执行本地 node_modules 中的包
# 2. ts-node：因为 TypeORM CLI 是 TypeScript 写的，需要实时编译
# 3. ./node_modules/typeorm/cli：TypeORM CLI 的入口文件
# 4. migration:create：具体的子命令
# 5. ./src/migration/Aaa：输出路径
```

# 现代化的 Migration 工作流

### 1. **项目配置**

```typescript
// ormconfig.ts 或 data-source.ts
export const config = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'test',
  
  // 开发环境
  synchronize: process.env.NODE_ENV === 'development',
  
  // 生产环境
  migrationsRun: process.env.NODE_ENV === 'production',
  migrations: ['dist/migration/*.js'],
  entities: ['dist/**/*.entity.js'],
};
```

### 2. **简化的命令配置**

```json
{
  "scripts": {
    "migration:generate": "typeorm migration:generate -d src/data-source.ts",
    "migration:create": "typeorm migration:create",
    "migration:run": "typeorm migration:run -d src/data-source.ts"
  }
}
```

```bash
# migration:generate 的工作流程：
# 1. 连接到数据库，查看当前表结构
# 2. 读取你的实体定义，了解期望的表结构  
# 3. 对比两者差异
# 4. 生成相应的 SQL 语句
```

```bash
# migration:generate - 才会对比
npm run migration:generate src/migration/AddUserTable

# 做的事：
# 1. 读取数据源配置文件
# 2. 连接数据库，扫描当前表结构
# 3. 读取entity定义，了解期望结构
# 4. 对比差异
# 5. 把差异写成SQL语句，保存到 src/migration/AddUserTable.ts
# 6. 不执行任何SQL，数据库没有变化

# migration:run - 只是执行
npm run migration:run

# 做的事：
# 1. 扫描 src/migration/ 文件夹，找到所有migration文件
# 2. 查询 migrations 表，看哪些已经执行过
# 3. 执行未执行的migration文件中的SQL语句
# 4. 在 migrations 表记录执行状态
# 5. 完成
```



### 3. **实际使用**

```bash
# 开发流程
npm run db:generate src/migration/AddUserTable    # 自动生成 migration
npm run db:migrate                                # 执行 migration

# 生产部署
npm run build                                     # 编译项目
npm run db:migrate                               # 执行数据库迁移
npm start                                        # 启动应用
```

# 两种 migration 命令的区别

### 1. **`migration:create`** - 创建空白模板

```bash
# 不需要数据源，只是创建文件模板
npx typeorm migration:create src/migration/AddUserTable

# 生成空白文件，你需要手写 SQL
export class AddUserTable implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 你需要手写 SQL
  }
  
  public async down(queryRunner: QueryRunner): Promise<void> {
    // 你需要手写 SQL  
  }
}
```

### 2. **`migration:generate`** - 自动生成SQL

```bash
# 需要数据源，自动生成 SQL
npx ts-node ./node_modules/typeorm/cli migration:generate ./src/migration/Aaa -d ./src/data-source.ts

# 自动生成完整的 SQL 语句
export class Aaa implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE user ADD COLUMN phone VARCHAR(255)`);
  }
  
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE user DROP COLUMN phone`);
  }
}
```

## 具体的工作原理

### TypeORM CLI 执行步骤：

```typescript
// 1. 读取数据源配置
const dataSource = await import('./src/data-source.ts');

// 2. 连接数据库
await dataSource.AppDataSource.initialize();

// 3. 获取当前数据库结构
const currentSchema = await dataSource.query('DESCRIBE user');
// 结果：{ name: 'varchar(50)', email: 'varchar(100)' }

// 4. 读取实体定义
const entities = dataSource.AppDataSource.options.entities;
// User 实体现在有 name, email, phone 三个字段

// 5. 对比差异
// 发现：实体有 phone 字段，但数据库没有

// 6. 生成 migration
// ALTER TABLE user ADD COLUMN phone VARCHAR(255)
```

## 如果不指定数据源会怎样？

### 错误示例：

```bash
# 不指定数据源
npx typeorm migration:generate ./src/migration/Aaa

# 报错：
Error: Cannot find data source configuration
```

### 原因：

- CLI 不知道连接哪个数据库
- 不知道有哪些实体
- 无法进行结构对比

# 最佳实践建议

### 1. **环境区分**

```typescript
// 开发环境：快速迭代
synchronize: true,  // 自动同步，方便开发

// 测试环境：接近生产
synchronize: false,
migrationsRun: true,

// 生产环境：绝对安全
synchronize: false,
migrationsRun: true,
```

### 2. **Migration 命名规范**

```
src/migration/
├── 20240115120000-CreateUserTable.ts
├── 20240115130000-AddEmailToUser.ts
├── 20240115140000-CreatePostTable.ts
└── 20240115150000-AddUserPostRelation.ts
```

### 3. **团队协作**

```bash
# 拉取代码后
git pull
npm run db:migrate  # 同步数据库结构

# 提交代码前
npm run db:generate src/migration/MyChanges  # 生成 migration
git add .
git commit -m "feat: add user phone field"
```

## 总结

**为什么生产环境必须用 Migration？**

- 保护生产数据安全
- 可控的数据库变更
- 支持回滚操作
- 团队协作一致性

**为什么命令复杂？**

- 历史遗留问题
- TypeORM CLI 的技术限制
- 但可以通过配置简化

**现代化解决方案：**

- 配置 package.json scripts
- 使用数据源文件
- 考虑使用 Prisma 等现代 ORM

记住：**开发环境可以用 synchronize，生产环境必须用 migration**！



