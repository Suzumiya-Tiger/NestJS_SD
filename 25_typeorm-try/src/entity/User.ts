import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { Post } from "./Post"

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

  // 计算属性：全名
  @Column({ nullable: true })
  name?: string

  // 建立一对多关系：一个 User 有多个 Post
  @OneToMany(() => Post, post => post.user)
  posts: Post[]
}