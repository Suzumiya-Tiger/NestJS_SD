import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm"
import { Article } from "./Article"

@Entity()
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 100
  })
  name: string;

  // 👈 添加反向关系
  @ManyToMany(() => Article, article => article.tags)
  articles: Article[];
}
