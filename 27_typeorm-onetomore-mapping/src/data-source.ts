import "reflect-metadata"
import { DataSource } from "typeorm"
import { Employee } from "./entity/Employee"
import { Department } from "./entity/Department"
export const AppDataSource = new DataSource({
  type: "mysql",
  host: "127.0.0.1",
  port: 3306,
  username: "root",
  password: "177376",
  database: "typeorm_test",
  synchronize: true,
  logging: true,  // 改为 true 显示所有 SQL 语句
  entities: [Employee, Department],
  migrations: [],
  subscribers: [],
  poolSize: 10,
  connectorPackage: 'mysql2',
  extra: {
    authPlugin: 'sha256_password',
  }
})
