import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WinstonModule } from './winston/winston.module';
import { transports, format } from 'winston';
import * as chalk from 'chalk';

@Module({
  imports: [
    WinstonModule.forRoot({
      level: 'debug',
      // format: format.combine(format.colorize(), format.simple()),
      transports: [
        new transports.Console({
          format: format.combine(
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Winston 自动添加时间戳

            format.colorize(),
            format.simple(),
            format.printf(({ context, level, message, timestamp }) => {
              const appStr = chalk.green(`[NEST]`);
              const contextStr = chalk.yellow(`[${context}]`);
              return `${appStr} ${contextStr} ${level} ${timestamp} ${message}`;
            }),
          ),
        }),
        new transports.DailyRotateFile({
          filename: 'application-%DATE%.log',
          dirname: 'logs',
          datePattern: 'YYYY-MM-DD', // 每天轮换
          zippedArchive: true, // 压缩旧文件
          maxSize: '20m', // 单文件最大 20MB
          maxFiles: '14d', // 保留 14 天的日志
          format: format.combine(format.timestamp(), format.json()),
        }),
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
