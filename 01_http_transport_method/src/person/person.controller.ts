import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { PersonService } from './person.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@Controller('api/person')
export class PersonController {
  constructor(private readonly personService: PersonService) { }

  @Post()
  create(@Body() createPersonDto: CreatePersonDto) {
    return this.personService.create(createPersonDto);
  }
  @Get('find')
  query(@Query('name') name: string, @Query('age') age: number) {
    return `name:${name},age:${age}`;
  }

  @Get()
  findAll() {
    return this.personService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personService.findOne(+id);
  }

  /*   @Post()
  body(@Body() createPersonDto: CreatePersonDto) {
    return `received:${JSON.stringify(createPersonDto)}`;
  }
 */
  @Post()
  body(@Body() createPersonDto: CreatePersonDto) {
    return `received:${JSON.stringify(createPersonDto)}`;
  }

  @Post('file')
  @UseInterceptors(
    AnyFilesInterceptor({
      dest: 'uploads/',
    }),
  )
  body2(
    @Body() createPersonDto: CreatePersonDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    console.log('=== 接收的普通数据 ===');
    console.log('Name:', createPersonDto.name); // '光'
    console.log('Age:', createPersonDto.age); // 20

    console.log('=== 接收的文件数据 ===');
    console.log('文件数量:', files.length); // 2
    files.forEach((file, index) => {
      console.log(`文件${index + 1}:`, {
        字段名: file.fieldname, // file1, file2
        原始名: file.originalname,
        大小: file.size,
      });
    });

    return `received: ${JSON.stringify(createPersonDto)}`;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePersonDto: UpdatePersonDto) {
    return this.personService.update(+id, updatePersonDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.personService.remove(+id);
  }
}
