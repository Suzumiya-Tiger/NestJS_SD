import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User"
import { Aaa } from "./entity/Aaa"
import { Post } from "./entity/Post"

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "127.0.0.1",
  port: 3306,
  username: "root",
  password: "177376",
  database: "practice",
  // 同步实体到数据库
  // synchronize这个属性很危险，生产环境关掉
  synchronize: true,
  entities: [User, Aaa, Post],
  migrations: [],
  subscribers: [],
  connectorPackage: 'mysql2',
  extra: {
    authPlugin: 'sha256_password',
  }
})
