import {
  Controller,
  Get,
  UploadedFile,
  UseInterceptors,
  Post,
  Body,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppService } from './app.service';
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import * as fs from 'fs';
import { storage } from './utils/storage';
import { FileSizeValidationPipePipe } from './file-size-validation-pipe.pipe';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('aaa')
  @UseInterceptors(
    FileInterceptor('aaa', {
      dest: 'uploads',
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body) {
    console.log('body', body);
    console.log('file', file);
  }

  @Post('bbb')
  @UseInterceptors(
    FilesInterceptor('bbb', 10, {
      dest: 'uploads',
    }),
  )
  uploadFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body,
  ) {
    console.log('body', body);
    console.log('files', files);
    return 'success';
  }

  // 多文件字段上传
  @Post('ccc')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'aaa', maxCount: 2 },
      { name: 'bbb', maxCount: 2 },
    ]),
  )
  uploadFiles2(
    @UploadedFiles()
    files: { aaa?: Express.Multer.File[]; bbb?: Express.Multer.File[] },
    @Body() body,
  ) {
    console.log('body', body);
    console.log('files', files);
    return 'success';
  }

  @Post('ddd')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: storage,
    }),
  )
  uploadAnyFile(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body,
  ) {
    console.log('body', body);
    console.log('files', files);
    return 'success';
  }

  @Post('eee')
  @UseInterceptors(
    FileInterceptor('aaa', {
      storage: storage,
    }),
  )
  UploadFile2(
    @UploadedFile(FileSizeValidationPipePipe) file: Express.Multer.File,
  ) {
    console.log('file', file);
    return 'success';
  }

  @Post('fff')
  @UseInterceptors(
    FileInterceptor('aaa', {
      storage: storage,
    }),
  )
  UploadedFile3(
    @UploadedFile(
      new ParseFilePipe({
        // 自定义失败返回的错误信息和状态码
        exceptionFactory: (error) => {
          return new HttpException(
            '文件验证失败: ' + error,
            HttpStatus.BAD_REQUEST, // 改为 400 而不是 500
          );
        },
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB 而不是 1KB
          new FileTypeValidator({ fileType: /image\/(jpeg|jpg|png|gif)/ }), // 支持多种图片格式
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body,
  ) {
    try {
      console.log('file', file);
      console.log('body', body);
      return 'success';
    } catch (error) {
      // 验证失败时删除文件
      fs.unlinkSync(file.path);
      throw error;
    }
  }
}
