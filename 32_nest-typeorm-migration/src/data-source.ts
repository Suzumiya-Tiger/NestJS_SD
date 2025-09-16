import { DataSource } from 'typeorm';
import { Article } from './article/entities/article.entity';
import * as dotenv from 'dotenv';

// 加载环境变量
// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
dotenv.config();
console.log('process.env', process.env);

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306') || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '177036',
  database: process.env.DB_DATABASE || 'nest-migration-test',
  synchronize: true,
  logging: true,
  entities: [Article],
  // migrations: ['src/migrations/*.ts'],
  subscribers: [],
  connectorPackage: 'mysql2',
  extra: {
    authPlugin: 'sha256_password',
  },
});
