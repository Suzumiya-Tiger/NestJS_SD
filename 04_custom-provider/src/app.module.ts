import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AaaModule } from './aaa/aaa.module';
import { BbbModule } from './bbb/bbb.module';
import { CccModule } from './ccc/ccc.module';
import { DddModule } from './ddd/ddd.module';

@Module({
  imports: [AaaModule, BbbModule, CccModule, DddModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'person',
      useFactory() {
        return {
          name: 'bbbb',
          age: 18,
        };
      },
    },
    {
      provide: 'person2',
      useFactory(person: { name: string }, appService: AppService) {
        return {
          name: person.name,
          desc: appService.getHello(),
        };
      },
      // inject代表依赖注入
      inject: ['person', AppService],
    },
    {
      provide: 'person3',
      async useFactory(person: { name: string }, appService: AppService) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return {
          name: person.name,
          desc: appService.getHello(),
        };
      },
      inject: ['person', AppService],
    },
  ],
})
export class AppModule {}
