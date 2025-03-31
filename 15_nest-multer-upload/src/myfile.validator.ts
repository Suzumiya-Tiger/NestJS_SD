import { FileValidator } from '@nestjs/common';

export class MyFileValidator extends FileValidator<Record<string, any>> {
  constructor(options) {
    super(options);
  }

  isValid(file: Express.Multer.File): boolean | Promise<boolean> {
    if (file.size > 10000) {
      return false;
    }
    return true;
  }
  buildErrorMessage(file: Express.Multer.File): string {
    return `文件${file.originalname}大小不能超过10000`;
  }
}
