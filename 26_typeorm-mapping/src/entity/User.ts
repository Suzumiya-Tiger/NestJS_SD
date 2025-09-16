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