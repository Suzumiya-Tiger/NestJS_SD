import { Inject, Injectable } from '@nestjs/common';
import { OtherService } from './other/other.service';
// @Injectable()代表了这个class可以被注入，所以nest就会把它放入到IOC容器中。

@Injectable()
export class AppService {
  @Inject(OtherService)
  private readonly otherService: OtherService;

  getHello(): string {
    return 'HELLO WORLD!' + this.otherService.getOther();
  }
}
