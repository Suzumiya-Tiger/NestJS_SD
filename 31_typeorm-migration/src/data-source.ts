import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User"
import { AddUserTable1757949617094 } from "./migration/1757949617094-AddUserTable"

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "127.0.0.1",
  port: 3306,
  username: "root",
  password: "155123",
  database: "migration-test",
  synchronize: false, // 关闭自动同步，使用迁移
  logging: true,
  entities: [User],
  migrations: [AddUserTable1757949617094], // 添加迁移文件
  subscribers: [],
  poolSize: 10,
  connectorPackage: 'mysql2',
  extra: {
    authPlugin: 'sha256_password',
  }
})