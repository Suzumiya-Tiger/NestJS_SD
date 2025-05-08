import {
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseInterceptors,
  Body,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
@Controller()
// ... existing code ...
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // 定义合并文件的 GET 请求路由 '/merge'
  @Get('merge')
  // @Query('name') 从 URL 查询参数中获取 'name' (即 fileNameForChunks)
  async merge(@Query('name') name: string) {
    // 构建分片存储的目录路径 (例如: "uploads/chunks_randomStr-originalFileName.jpg")
    const chunkDir = 'uploads/chunks_' + name;

    // 检查分片目录是否存在
    if (!fs.existsSync(chunkDir)) {
      console.error(`Directory not found: ${chunkDir}`);
      // 如果目录不存在，返回错误信息，不进行合并
      return {
        success: false,
        message: `Cannot merge: no chunks found for ${name}. Please ensure all chunks are uploaded.`,
      };
    }

    // 读取分片目录中的所有文件名
    const files = fs.readdirSync(chunkDir).sort((a, b) => {
      // 解析文件名末尾的索引号 (例如 "file-0", "file-1") 并进行排序
      // 确保分片按正确的顺序合并
      const numA = parseInt(a.split('-').pop() || '0');
      const numB = parseInt(b.split('-').pop() || '0');
      return numA - numB;
    });

    // 构建最终合并后文件的完整路径 (例如: "uploads/randomStr-originalFileName.jpg")
    const finalFilePath = 'uploads/' + name;
    console.log(`合并文件将保存到: ${finalFilePath}`);

    // 如果已存在同名的最终文件，则先删除它(去重)
    if (fs.existsSync(finalFilePath)) {
      fs.unlinkSync(finalFilePath);
    }

    // 遍历所有已排序的分片文件
    for (const file of files) {
      // 构建当前分片文件的完整路径
      const filePath = chunkDir + '/' + file;
      // 创建分片文件的可读流
      const sourceStream = fs.createReadStream(filePath);
      // 创建最终合并文件的可写流，使用 'a' (append) 模式追加内容
      const destinationStream = fs.createWriteStream(finalFilePath, {
        flags: 'a',
      });

      // 等待当前分片通过管道流式传输到最终文件
      await new Promise<void>((resolve, reject) => {
        sourceStream.pipe(destinationStream); // 将可读流导入可写流
        // 当可写流完成写入时，解决 Promise
        destinationStream.on('finish', () => {
          resolve();
        });
        // 如果任一流程发生错误，拒绝 Promise
        destinationStream.on('error', reject);
        sourceStream.on('error', reject);
      });
    }

    // 所有分片合并完成后，尝试删除分片目录
    try {
      await new Promise<void>((resolve, reject) => {
        // 异步删除分片目录及其内容
        fs.rm(chunkDir, { recursive: true }, (err) => {
          if (err) {
            console.error(`Failed to remove chunk directory: ${err.message}`);
            reject(err); // 删除失败，拒绝 Promise
          } else {
            resolve(); // 删除成功，解决 Promise
          }
        });
      });
      // 如果删除目录成功
      return {
        message: `${name} merged successfully AND chunks directory removed.`,
      };
    } catch (error) {
      // 如果删除目录失败
      console.error(
        'Merge successful, but failed to remove chunks directory:',
        error,
      );
      return {
        message: `${name} merged successfully, but failed to clean up temporary files.`,
        error: error.message, // 在响应中包含错误信息
      };
    }
  }

  // 定义上传分片的 POST 请求路由 '/upload'
  @Post('upload')
  // 使用 FilesInterceptor 处理 'files' 字段的 multipart/form-data 上传
  // 最多允许20个文件，临时存储在 'uploads' 目录
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      dest: 'uploads', // Multer 会将上传的文件临时存放在此
    }),
  )
  // @UploadedFiles() 获取上传的文件数组
  // @Body() 获取请求体中的数据 (包含 'name' 字段)
  uploadFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: { name: string }, // body.name 是 "fileNameForChunks-index"
  ) {
    console.log('body', body);
    console.log('files', files); // files[0] 是 Multer 处理后的文件对象

    // 使用正则表达式从分片名称中提取基础文件名 (fileNameForChunks)
    // 例如，从 "randomStr-originalFileName.jpg-0" 中提取 "randomStr-originalFileName.jpg"
    const matches = body.name.match(/(.+)\-\d+$/);

    // 如果文件名格式不匹配，记录错误并返回
    if (!matches || !matches[1]) {
      console.error(
        `Error: Filename '${body.name}' does not match expected pattern 'name-number'.`,
      );
      return;
    }

    const fileName: string = matches[1]; // 提取出的基础文件名
    // 构建此文件所有分片应存储的目录 (例如: "uploads/chunks_randomStr-originalFileName.jpg")
    const chunkDir = 'uploads/chunks_' + fileName;

    // 如果分片目录不存在，则创建它
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir);
    }
    // 将 Multer 临时保存的文件 (files[0].path) 复制到分片目录中，并使用其完整分片名 (body.name)
    fs.cpSync(files[0].path, chunkDir + '/' + body.name);
    // 删除 Multer 创建的临时文件，因为它已经被复制到正确位置了
    fs.rmSync(files[0].path);
  }
}
