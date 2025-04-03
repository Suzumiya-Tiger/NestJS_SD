import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseInterceptors,
  BadRequestException,
  UploadedFile,
} from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { storage } from 'src/utils/storage';
import * as path from 'path';
@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get('list')
  list() {
    return this.bookService.list();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.bookService.findById(+id);
  }

  @Post('create')
  create(@Body() createBookDto: CreateBookDto) {
    return this.bookService.create(createBookDto);
  }

  @Put('update')
  update(@Body() updateBookDto: UpdateBookDto) {
    return this.bookService.update(updateBookDto);
  }
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: storage,
      limits: {
        fileSize: 1024 * 1024 * 3,
      },
      fileFilter: (req, file, cb) => {
        /* 	•	file.originalname 是上传文件的原始文件名（如 "image.png"）。
	          •	path.extname(file.originalname) 获取该文件的扩展名，如 ".png"。 */
        const extname = path.extname(file.originalname);
        if (['.png', '.jpg', '.jpeg'].includes(extname)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('只能上传png,jpg,jpeg格式的图片'), false);
        }
      },
    }),
  )
  async uplodaFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { id: string },
  ) {
    const foundBook = (await this.bookService.findById(
      +body.id,
    )) as UpdateBookDto;
    if (foundBook) {
      foundBook.cover = file.path;
      await this.bookService.update(foundBook);
      return {
        url: file.path,
        message: foundBook.name + '上传封面成功',
      };
    }
    return {
      url: '',
      message: '请先创建书籍',
    };
  }
  @Delete('delete/:id')
  delete(@Param('id') id: string) {
    return this.bookService.delete(+id);
  }
}
