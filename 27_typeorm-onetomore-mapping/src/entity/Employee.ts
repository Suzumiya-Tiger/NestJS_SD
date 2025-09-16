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
    name: "d_id"
  })
  @ManyToOne(() => Department, {
    // cascade: true
    // 只要删除了department，就可以自动删除关联的employee
    onDelete: 'CASCADE'
  })
  department: Department;
}

