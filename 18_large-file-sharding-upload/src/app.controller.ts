import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files',20,{
    dest:'uploads'
  }))
  uploadFiles(@UploadedFiles() files:Array<Express.Multer.File>,@Body body)
}
