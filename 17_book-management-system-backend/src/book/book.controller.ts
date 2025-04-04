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
  Query,
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
  async list(@Query('name') name: string) {
    return this.bookService.list(name);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.bookService.findById(+id);
  }

  @Post('create')
  create(@Body() createBookDto: CreateBookDto) {
    // 创建时关联上传的封面
    return this.bookService.create(createBookDto);
  }

  @Put('update/:id')
  update(
    @Param('id') id: string,
    @Body() updateData: Omit<UpdateBookDto, 'id'>,
  ) {
    // 创建包含 id 的完整 UpdateBookDto
    const updateBookDto: UpdateBookDto = {
      id: +id,
      ...updateData,
    };

    // 更新时关联上传的封面
    return this.bookService.update(+id, updateBookDto);
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
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }

    // 生成文件路径，这时文件已经保存到服务器
    const coverPath = `/my-uploads/${path.basename(file.path)}`;

    // 只返回上传路径，不做任何关联操作
    return {
      url: coverPath,
      message: '图片已上传成功',
    };
  }
  @Delete('delete/:id')
  delete(@Param('id') id: string) {
    return this.bookService.delete(+id);
  }
}
