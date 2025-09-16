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
    cascade: true  // 👈 保存Department时自动保存Employee

  })
  employees: Employee[];
}
