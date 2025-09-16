import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { User } from "./User"

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  @Column("text")
  content: string

  @Column({ default: true })
  isActive: boolean

  // 外键字段，关联到 User
  @Column()
  userId: number

  // 建立多对一关系：多个 Post 属于一个 User
  @ManyToOne(() => User, user => user.posts)
  @JoinColumn({ name: 'userId' })
  user: User

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}