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

// 定义City实体类，对应数据库中的city表
@Entity()
// 使用树形结构装饰器，采用closure-table策略存储层级关系
// closure-table是一种高效的树形数据存储方案，适合频繁查询整个子树的场景
@Tree('closure-table')
export class City {
  // 主键ID，自动递增
  @PrimaryGeneratedColumn()
  id: number;

  // 状态字段，默认值为0
  // 可用于标识城市的启用/禁用状态等
  @Column({ default: 0 })
  status: number;

  // 创建时间，插入记录时自动设置
  @CreateDateColumn()
  createDate: Date;

  // 更新时间，每次更新记录时自动设置
  @UpdateDateColumn()
  updateDate: Date;

  // 城市名称，必填字段
  @Column()
  name: string;

  // 子城市列表（一对多关系）
  // 例如：华北地区包含山东、河北等子区域
  @TreeChildren()
  children: City[];

  // 父城市（多对一关系）
  // 例如：山东的父级是华北地区
  @TreeParent()
  parent: City;
}
