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
  @OneToOne(() => User, user => user.idCard, {
    cascade: ['insert', 'update'],  // 级联操作
    onDelete: 'CASCADE',            // 删除用户时删除身份证
    nullable: false,                // 外键不能为空
    eager: false                    // 不自动加载关联数据
  })  // 关键：指定反向属性
  user: User
}