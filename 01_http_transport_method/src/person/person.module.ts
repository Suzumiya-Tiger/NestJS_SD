import { Module } from '@nestjs/common';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { AppService } from 'src/app.service';

@Module({
  controllers: [PersonController],
  providers: [
    PersonService,
    {
      provide: 'app_service',
      useClass: AppService,
    },
    {
      provide:"person",
      useValue:{
        name:"aaa",
        age:20
      }
    }
  ],
})
export class PersonModule { }
