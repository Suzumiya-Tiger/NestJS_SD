# Nest装饰器梳理

App.controller.ts
```ts
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  UseFilters,
} from '@nestjs/common';
import { AppService } from './app.service';
import { TestFilter } from './test.filter';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Inject('Guang')
  private readonly guang: Record<string, any>;
  @Get()
  @UseFilters(TestFilter)
  getHello(): string {
    console.log('guang', this.guang);
    throw new HttpException('123', HttpStatus.BAD_REQUEST);
    return this.appService.getHello();
  }
}

```

test.filter.ts

```javascript
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
@Catch(HttpException)
export class TestFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response: Response = host.switchToHttp().getResponse();
    response.status(exception.getStatus()).json({
      statusCode: exception.getStatus(),
      message: exception.getResponse(),
    });
  }
}

```

