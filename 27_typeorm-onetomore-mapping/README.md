# TypeORM OneToMany 关系映射详解

## 项目概述

本项目演示了如何使用 TypeORM 实现 OneToMany (一对多) 关系映射，通过 `Department` (部门) 和 `Employee` (员工) 两个实体展示了完整的关系配置和使用方式。

## 技术栈

- **TypeORM**: 0.3.26
- **MySQL2**: 3.14.5
- **TypeScript**: 5.8.2
- **Node.js**: 运行环境
- **MySQL**: 数据库

## 关系设计

### 业务关系
- 一个部门可以有多个员工 (OneToMany)
- 一个员工只能属于一个部门 (ManyToOne)

### 数据库表结构
```sql
-- department 表
CREATE TABLE department (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- employee 表  
CREATE TABLE employee (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    d_id INT,  -- 外键字段
    FOREIGN KEY (d_id) REFERENCES department(id) ON DELETE CASCADE
);
```

## 实体类定义

### Department 实体 (一的一方)

```typescript
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { Employee } from "./Employee";

@Entity()
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 50
  })
  name: string;

  @OneToMany(() => Employee, (employee) => employee.department, {
    cascade: true  // 保存Department时自动保存Employee
  })
  employees: Employee[];
}
```

#### 关键配置说明：

1. **@OneToMany 装饰器**
   - `() => Employee`: 目标实体类型
   - `(employee) => employee.department`: 反向关系属性
   - `cascade: true`: 级联保存，保存部门时自动保存关联的员工

2. **employees 属性**
   - 类型为 `Employee[]` 数组
   - 表示一个部门包含多个员工

### Employee 实体 (多的一方)

```typescript
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { Department } from "./Department";

@Entity()
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 50
  })
  name: string;

  @JoinColumn({
    name: "d_id"  // 自定义外键字段名
  })
  @ManyToOne(() => Department, {
    onDelete: 'CASCADE'  // 删除部门时自动删除关联员工
  })
  department: Department;
}
```

#### 关键配置说明：

1. **@ManyToOne 装饰器**
   - `() => Department`: 目标实体类型
   - `onDelete: 'CASCADE'`: 级联删除策略

2. **@JoinColumn 装饰器**
   - `name: "d_id"`: 自定义外键字段名
   - 如不指定，默认为 `departmentId`

3. **department 属性**
   - 类型为 `Department`
   - 表示员工所属的部门

## 关系生成机制

### 1. 表结构生成

TypeORM 会自动根据实体定义生成数据库表：

- **department 表**: 包含 `id` 和 `name` 字段
- **employee 表**: 包含 `id`、`name` 和 `d_id`(外键) 字段
- **外键约束**: `d_id` 引用 `department.id`，设置 `ON DELETE CASCADE`

### 2. 关系映射原理

```typescript
Department (1) ←→ (N) Employee

↑ ↓

OneToMany ManyToOne

employees[] department
```

- **物理存储**: 外键存储在 Employee 表的 `d_id` 字段
- **对象映射**: Department 对象包含 employees 数组，Employee 对象包含 department 引用
- **双向关联**: 两个实体互相引用，形成完整的关系映射

## 数据源配置

```typescript
export const AppDataSource = new DataSource({
  type: "mysql",
  host: "127.0.0.1",
  port: 3306,
  username: "root",
  password: "355477",
  database: "typeorm_test",
  synchronize: true,        // 自动同步表结构
  logging: true,           // 显示 SQL 语句
  entities: [Employee, Department],
  poolSize: 10,
  connectorPackage: 'mysql2'
})
```

## 实际使用示例

### 1. 创建和保存数据

```typescript
// 创建部门
const dept = new Department();
dept.name = '技术部';

// 创建员工
const employee1 = new Employee();
employee1.name = '张三';
employee1.department = dept;  // 建立关联

const employee2 = new Employee();
employee2.name = '李四';
employee2.department = dept;

// 保存（利用 cascade: true）
await manager.save(Department, dept);
// 或分别保存
await manager.save(Employee, employee1);
await manager.save(Employee, employee2);
```

### 2. 查询关联数据

```typescript
// 查询部门及其所有员工
const departments = await manager.find(Department, {
  relations: ['employees']
});

departments.forEach(dept => {
  console.log(`部门: ${dept.name}`);
  dept.employees.forEach(emp => {
    console.log(`  员工: ${emp.name}`);
  });
});

// 查询员工及其所属部门
const employees = await manager.find(Employee, {
  relations: ['department']
});

employees.forEach(emp => {
  console.log(`员工: ${emp.name}, 部门: ${emp.department?.name}`);
});
```

### 3. 事务处理示例

```typescript
await AppDataSource.manager.transaction(async manager => {
  // 查找或创建部门
  let dept = await manager.findOne(Department, {
    where: { name: '技术部' }
  });

  if (!dept) {
    dept = new Department();
    dept.name = '技术部';
    dept = await manager.save(Department, dept);
  }

  // 创建员工并关联部门
  const employeeNames = ['张三', '李四', '王五'];
  for (const name of employeeNames) {
    let employee = await manager.findOne(Employee, {
      where: { name },
      relations: ['department']
    });

    if (!employee) {
      employee = new Employee();
      employee.name = name;
      employee.department = dept;
      await manager.save(Employee, employee);
    }
  }
});
```

## 级联操作详解

### 1. Cascade 选项

```typescript
// Department 实体中
@OneToMany(() => Employee, (employee) => employee.department, {
  cascade: true  // 或者 cascade: ["insert", "update"]
})
employees: Employee[];
```

**cascade 选项类型:**
- `true`: 启用所有级联操作
- `["insert"]`: 仅级联插入
- `["update"]`: 仅级联更新
- `["remove"]`: 仅级联删除
- `["insert", "update"]`: 级联插入和更新

### 2. OnDelete 策略

```typescript
// Employee 实体中
@ManyToOne(() => Department, {
  onDelete: 'CASCADE'  // 删除策略
})
department: Department;
```

**删除策略选项:**
- `CASCADE`: 级联删除
- `SET NULL`: 设置为 NULL
- `RESTRICT`: 限制删除
- `NO ACTION`: 无操作

## 最佳实践

### 1. 关系配置建议

```typescript
// 在 "一" 的一方设置 cascade
@OneToMany(() => Employee, employee => employee.department, {
  cascade: ["insert", "update"]  // 推荐明确指定
})

// 在 "多" 的一方设置 onDelete
@ManyToOne(() => Department, {
  onDelete: 'CASCADE'
})
```

### 2. 查询优化

```typescript
// 使用 relations 预加载关联数据
const departments = await repository.find({
  relations: ['employees']
});

// 使用 QueryBuilder 进行复杂查询
const result = await repository
  .createQueryBuilder('dept')
  .leftJoinAndSelect('dept.employees', 'emp')
  .where('dept.name = :name', { name: '技术部' })
  .getMany();
```

#### 1. **为什么最好先创建 Repository？**

**核心原因**：Repository 提供了更好的**类型安全**和**上下文绑定**

```typescript
// ❌ 直接从 DataSource
AppDataSource.createQueryBuilder(Department, 'dept')  // 需要重复指定实体

// ✅ 通过 Repository  
const repo = AppDataSource.getRepository(Department);
repo.createQueryBuilder('dept')  // 已经知道操作 Department
```

**优势**：

- 🎯 **类型安全**：IDE 智能提示，编译时检查
- 🔧 **功能封装**：可以添加自定义查询方法
- 📝 **代码简洁**：不需要重复指定实体类型

#### 2. **每次都要创建新的 QueryBuilder？**

**是的，必须每次创建新的**，原因：

```typescript
// ❌ 重用会导致条件累积
const qb = repo.createQueryBuilder('dept');
qb.where('name = :name', { name: '技术部' });     // 第一个条件
qb.where('id = :id', { id: 1 });                  // 第二个条件叠加！
// 最终 SQL: WHERE name = '技术部' AND id = 1

// ✅ 每次创建新的
const qb1 = repo.createQueryBuilder('dept').where('name = :name', { name: '技术部' });
const qb2 = repo.createQueryBuilder('dept').where('id = :id', { id: 1 });
```

**原因**：

- 🔄 **状态累积**：避免条件叠加
- 🛡️ **线程安全**：避免并发冲突
- 🏗️ **建造者模式**：一次性构建对象

#### 3. **为什么是 `dept.employees` 而不是 `employees`？**

**核心原因**：TypeORM 需要通过**关系路径**来理解实体关系

```typescript
// ✅ 正确：关系路径
.leftJoinAndSelect('dept.employees', 'emp')
//                  ↑      ↑        ↑
//               主表别名  关系属性   新别名

// ❌ 错误：直接表名  
.leftJoinAndSelect('employees', 'emp')  // TypeORM 不知道如何关联
```

**工作机制**：

1. `dept` = 主表别名
2. `employees` = Department 实体中的 `@OneToMany` 属性
3. TypeORM 读取装饰器信息，自动生成 `JOIN dept d LEFT JOIN employee e ON e.d_id = d.id`

**关系路径的优势**：

- 🔗 **自动关联**：TypeORM 自动处理外键关系
- 🛡️ **类型安全**：编译时检查关系是否存在
- 🎯 **支持嵌套**：`dept.employees.projects` 等复杂关系

**leftJoinAndSelect('dept.employees', 'emp') 的含义：** 

1. 'dept.employees' 是关系路径：   
   - 'dept' 是主表的别名   - 'employees' 是 Department 实体中定义的关系属性   
   - **TypeORM 通过这个路径自动找到对应的外键关系** 
2. TypeORM 的关系解析机制：  
   - 读取 Department 实体中的 @OneToMany 装饰器  
   - 找到对应的外键字段（d_id）   
   - 自动生成正确的 JOIN 条件

这种设计让 TypeORM 能够基于实体定义自动生成正确的 SQL，而不需要手动维护表关系！

### 3. 避免 N+1 查询问题

```typescript
// ❌ 错误方式 - 会产生 N+1 查询
const departments = await departmentRepo.find();
for (const dept of departments) {
  const employees = await employeeRepo.find({ 
    where: { department: { id: dept.id } } 
  });
}

// ✅ 正确方式 - 一次查询获取所有数据
const departments = await departmentRepo.find({
  relations: ['employees']
});
```

## 总结

OneToMany 关系映射的核心要点：

1. **双向关系**: 在两个实体中都要定义关系属性
2. **外键存储**: 外键存储在 "多" 的一方
3. **装饰器配置**: 使用 `@OneToMany` 和 `@ManyToOne` 装饰器
4. **级联操作**: 合理配置 cascade 和 onDelete 选项
5. **查询优化**: 使用 relations 预加载，避免 N+1 问题
6. **事务处理**: 复杂操作使用事务确保数据一致性

通过这种方式，TypeORM 能够自动处理对象关系映射，简化数据库操作，提高开发效率。
