import { applyDecorators, Controller, SetMetadata } from '@nestjs/common';

export const GetClassCto = (path, metadata) => {
  return applyDecorators(Controller(path), SetMetadata('metadata', metadata));
};
