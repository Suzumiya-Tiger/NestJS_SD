import { Injectable } from '@nestjs/common';
import { AppService } from './app.service';

@Injectable()
export class HeinrichService {
  constructor(private readonly appService: AppService) {}
  getHello(): string {
    return this.appService.getHello();
  }
}
