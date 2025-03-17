import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ValidatePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // First convert to number if string
    const num =
      typeof value === 'string'
        ? parseInt(value)
        : typeof value === 'number'
          ? value
          : NaN;

    if (Number.isNaN(num)) {
      throw new BadRequestException('Validation failed');
    }

    return num * 10;
  }
}
