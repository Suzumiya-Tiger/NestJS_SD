import { Injectable } from '@nestjs/common';

@Injectable()
export class OtherService {
  getOther(): string {
    return 'OTHER SERVICE!';
  }
}
