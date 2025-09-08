// 导入 Winston 日志库
import winston from 'winston';
import 'winston-daily-rotate-file';

// 创建一个日志记录器实例
const logger = winston.createLogger({
  // 设置日志级别为 debug
  // Winston 日志级别从高到低：error > warn > info > http > verbose > debug > silly
  level: 'debug',

  // 设置日志格式为简单格式（时间戳 + 级别 + 消息）
  // format: winston.format.simple(),

  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
  ),

  // 配置传输方式（日志输出目标）
  transports: [
    // 输出到控制台
    new winston.transports.Console(),

    // 输出到文件（注意：这里应该是 transports 而不是 transport）
    /*     new winston.transports.File({
      dirname: 'log', // 日志文件目录
      filename: 'test.log', // 日志文件名
      // 自动根据maxsize属性切割日志文件
      // 自动根据maxFiles属性删除旧的日志文件
      maxsize: 5 * 1024 * 1024, // 日志文件最大大小
      maxFiles: 3, // 日志文件最大数量
    }), */

    new winston.transports.DailyRotateFile({
      // 设置此传输的日志级别为 'info'
      // 只有 info 级别及以上的日志（info, warn, error）会被写入到这个文件
      level: 'info',

      // 指定日志文件存储的目录为 'log2'
      // 如果目录不存在，winston 会自动创建
      dirname: 'log2',

      // 日志文件名模板，%DATE% 会被实际的日期替换
      // 例如：application-2024-01-15-14.log
      filename: 'application-%DATE%.log',

      // 日期格式模式，决定了文件轮转的频率
      // 'YYYY-MM-DD-HH' 表示每小时创建一个新的日志文件
      // 其他常用模式：
      // - 'YYYY-MM-DD' (每天轮转)
      // - 'YYYY-MM-DD-HH-mm' (每分钟轮转)
      datePattern: 'YYYY-MM-DD-HH',

      // 启用压缩归档功能
      // 当日志文件不再是当前活跃文件时，会被压缩成 .gz 格式
      // 这样可以节省磁盘空间
      zippedArchive: true,

      // 单个日志文件的最大大小为 1KB
      // 当文件达到这个大小时，会触发轮转（创建新文件）
      // 支持的单位：'k', 'm', 'g' 分别代表 KB, MB, GB
      maxSize: '1k',
    }),

    new winston.transports.Http({
      host: 'localhost',
      port: '3000',
      path: '/log',
    }),
  ],
});

// 记录不同级别的日志消息（使用《凉宫春日的忧郁》角色相关内容）

// info 级别 - 一般信息
logger.info('凉宫春日的忧郁');

// error 级别 - 错误信息（最高优先级）
logger.error('长门有希的消失');

// debug 级别 - 调试信息
logger.debug('朝比奈实玖瑠的微笑');

// warn 级别 - 警告信息
logger.warn('阿虚的吐槽');

// verbose 级别 - 详细信息
logger.verbose('古泉一树的冷笑话');

// silly 级别 - 最详细的调试信息（最低优先级）
logger.silly('凉宫春日的大笑');
