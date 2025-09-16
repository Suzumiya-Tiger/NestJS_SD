## 树形结构基础概念

### 什么是树形结构？

树形结构是一种分层的数据组织方式，类似于家族谱或组织架构图：

```
中国
├── 北京市
│   ├── 朝阳区
│   ├── 海淀区
│   └── 丰台区
├── 上海市
│   ├── 黄浦区
│   ├── 浦东新区
│   └── 静安区
└── 广东省
    ├── 广州市
    │   ├── 天河区
    │   └── 越秀区
    └── 深圳市
        ├── 南山区
        └── 福田区
```

## 装饰器详解

### 1. `@Entity()` 装饰器

```typescript
@Entity()
```

- **作用**：将类标记为 TypeORM 实体
- **功能**：告诉 TypeORM 这个类对应数据库中的一张表
- **默认行为**：表名默认为类名（City），实际表名为 `city`

### 2. `@Tree('closure-table')` 装饰器

```typescript
@Tree('closure-table')
```

- **作用**：将实体标记为树形结构
- **参数**：`'closure-table'` 是树形存储策略
- **功能**：启用 TypeORM 的树形结构功能

## 树形存储策略对比

TypeORM 支持多种树形存储策略：

```typescript
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Tree('closure-table')
export class City {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  status: number;

  @CreateDateColumn()
  createDate: Date;

  @UpdateDateColumn()
  updateDate: Date;

  @Column()
  name: string;

  @TreeChildren()
  children: City[];

  @TreeParent()
  parent: City;
}

```

### 1. Closure Table(当前使用)

```ts
-- city 表（主表）
CREATE TABLE city (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    status INT DEFAULT 0,
    createDate DATETIME,
    updateDate DATETIME
);

-- city_closure 表（关系表，自动生成）
CREATE TABLE city_closure (
    id_ancestor INT,    -- 祖先节点ID
    id_descendant INT,  -- 后代节点ID
    depth INT          -- 层级深度
);
```

**优点**：

- 查询任意节点的所有子孙非常快
- 查询任意节点的所有祖先非常快
- 移动子树相对简单

**缺点**：

- 需要额外的关系表，占用更多存储空间
- 插入和删除节点较复杂

### 2. Adjacency List（邻接表）

```sql
CREATE TABLE city (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    parent_id INT  -- 直接存储父节点ID
);
```

### 3. Nested Set（嵌套集合）

```sql
CREATE TABLE city (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    lft INT,   -- 左值
    rgt INT    -- 右值
);
```

### 4. Materialized Path（物化路径）

```sql
CREATE TABLE city (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    path VARCHAR(255)  -- 存储从根到当前节点的完整路径
);
```

## 树形装饰器说明

### `@TreeChildren()` 装饰器

typescript

```typescript
@TreeChildren()
children: City[];
```

- **作用**：定义子节点关系
- **类型**：数组，包含所有直接子节点
- **自动加载**：TypeORM 会自动处理这个关系

### `@TreeParent()` 装饰器

typescript

```typescript
@TreeParent()
parent: City;
```

- **作用**：定义父节点关系
- **类型**：单个实体，表示直接父节点
- **可选性**：根节点的 parent 为 null

## 实际使用示例

通过一个 Service 示例来演示如何使用，这个如果实在难理解可以跳过的：

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';
import { City } from './entities/city.entity';

@Injectable()
export class CityService {
  constructor(
    @InjectRepository(City)
    private cityRepository: TreeRepository<City>, // 注意：使用 TreeRepository
  ) {}

  // 创建根节点城市
  async createRootCity(name: string): Promise<City> {
    const city = this.cityRepository.create({
      name,
      parent: null, // 根节点没有父节点
    });
    return this.cityRepository.save(city);
  }

  // 创建子城市
  async createChildCity(name: string, parentId: number): Promise<City> {
    const parent = await this.cityRepository.findOne({
      where: { id: parentId }
    });
    
    if (!parent) {
      throw new Error('父城市不存在');
    }

    const city = this.cityRepository.create({
      name,
      parent, // 设置父节点
    });
    
    return this.cityRepository.save(city);
  }

  // 获取完整的城市树
  async getCityTree(): Promise<City[]> {
    return this.cityRepository.findTrees();
  }

  // 获取指定城市的所有后代
  async getCityDescendants(cityId: number): Promise<City[]> {
    const city = await this.cityRepository.findOne({
      where: { id: cityId }
    });
    
    if (!city) {
      throw new Error('城市不存在');
    }

    return this.cityRepository.findDescendants(city);
  }

  // 获取指定城市的所有祖先
  async getCityAncestors(cityId: number): Promise<City[]> {
    const city = await this.cityRepository.findOne({
      where: { id: cityId }
    });
    
    if (!city) {
      throw new Error('城市不存在');
    }

    return this.cityRepository.findAncestors(city);
  }

  // 获取指定城市的直接子节点
  async getCityChildren(cityId: number): Promise<City[]> {
    const city = await this.cityRepository.findOne({
      where: { id: cityId },
      relations: ['children'], // 加载子节点关系
    });
    
    return city ? city.children : [];
  }

  // 移动城市到新的父节点下
  async moveCity(cityId: number, newParentId: number): Promise<City> {
    const city = await this.cityRepository.findOne({
      where: { id: cityId }
    });
    const newParent = await this.cityRepository.findOne({
      where: { id: newParentId }
    });

    if (!city || !newParent) {
      throw new Error('城市不存在');
    }

    city.parent = newParent;
    return this.cityRepository.save(city);
  }

  // 获取城市树的扁平化表示（带层级信息）
  async getCityTreeFlat(): Promise<any[]> {
    const trees = await this.cityRepository.findTrees();
    const flatResult: any[] = [];

    const flatten = (nodes: City[], level = 0, parentPath = '') => {
      nodes.forEach(node => {
        const currentPath = parentPath ? `${parentPath} > ${node.name}` : node.name;
        flatResult.push({
          id: node.id,
          name: node.name,
          level,
          path: currentPath,
          hasChildren: node.children && node.children.length > 0,
        });

        if (node.children && node.children.length > 0) {
          flatten(node.children, level + 1, currentPath);
        }
      });
    };

    flatten(trees);
    return flatResult;
  }

  // 删除城市及其所有子节点
  async deleteCity(cityId: number): Promise<void> {
    const city = await this.cityRepository.findOne({
      where: { id: cityId }
    });
    
    if (!city) {
      throw new Error('城市不存在');
    }

    // 获取所有后代节点
    const descendants = await this.cityRepository.findDescendants(city);
    
    // 删除所有后代节点（包括自己）
    await this.cityRepository.remove(descendants);
  }

  // 搜索城市（在整个树中）
  async searchCities(keyword: string): Promise<City[]> {
    return this.cityRepository
      .createQueryBuilder('city')
      .where('city.name LIKE :keyword', { keyword: `%${keyword}%` })
      .getMany();
  }

  // 获取叶子节点（没有子节点的城市）
  async getLeafCities(): Promise<City[]> {
    return this.cityRepository
      .createQueryBuilder('city')
      .leftJoin('city.children', 'children')
      .where('children.id IS NULL')
      .getMany();
  }

  // 获取根节点
  async getRootCities(): Promise<City[]> {
    return this.cityRepository
      .createQueryBuilder('city')
      .where('city.parent IS NULL')
      .getMany();
  }
}
```

## 数据库表结构

使用 `@Tree('closure-table')` 后，TypeORM 会自动创建两张表：

### 主表 `city`

```sql
CREATE TABLE city (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status INT DEFAULT 0,
    createDate DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updateDate DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    name VARCHAR(255) NOT NULL
);
```

### 关系表 `city_closure`（自动生成）

```sql
CREATE TABLE city_closure (
    id_ancestor INT NOT NULL,
    id_descendant INT NOT NULL,
    depth INT NOT NULL,
    PRIMARY KEY (id_ancestor, id_descendant),
    FOREIGN KEY (id_ancestor) REFERENCES city(id) ON DELETE CASCADE,
    FOREIGN KEY (id_descendant) REFERENCES city(id) ON DELETE CASCADE
);
```

## 数据示例

### city 表数据

```
id | name   | status | parent_id
---|--------|--------|----------
1  | 中国   | 1      | NULL
2  | 北京市 | 1      | NULL  
3  | 朝阳区 | 1      | NULL
4  | 海淀区 | 1      | NULL
```

### city_closure 表数据

```
id_ancestor | id_descendant | depth
------------|---------------|------
1           | 1             | 0     -- 中国到自己
1           | 2             | 1     -- 中国到北京市
1           | 3             | 2     -- 中国到朝阳区
1           | 4             | 2     -- 中国到海淀区
2           | 2             | 0     -- 北京市到自己
2           | 3             | 1     -- 北京市到朝阳区
2           | 4             | 1     -- 北京市到海淀区
3           | 3             | 0     -- 朝阳区到自己
4           | 4             | 0     -- 海淀区到自己
```

## 使用场景

树形结构常用于：

1. **地理区域**：国家 → 省份 → 城市 → 区县
2. **组织架构**：公司 → 部门 → 小组 → 员工
3. **商品分类**：一级分类 → 二级分类 → 三级分类
4. **评论系统**：文章 → 评论 → 回复 → 回复的回复
5. **菜单系统**：主菜单 → 子菜单 → 子子菜单

## 总结

- `@Entity()`：标记为数据库实体
- `@Tree('closure-table')`：启用闭包表树形结构
- `@TreeChildren()`：定义子节点关系
- `@TreeParent()`：定义父节点关系
- 使用 `TreeRepository` 而不是普通的 `Repository`
- Closure Table 策略适合频繁查询树形结构的场景

这种设计让你可以高效地处理复杂的层级关系，比如快速查找某个城市的所有下级行政区，或者查找某个区属于哪些上级行政区。
