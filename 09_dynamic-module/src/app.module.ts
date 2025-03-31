import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BbbModule } from './bbb/bbb.module';
import { CccModule } from './ccc/ccc.module';

@Module({
  imports: [
    BbbModule.register({
      a: 1,
      b: 2,
    }),
    // CccModule.register({
    //   apiKey: '1234567890',
    //   endpoint: 'https://api.example.com',
    //   timeout: 5000,
    //   debug: true,
    // }),
    // CccModule.forRoot({
    //   apiKey: '1234567890',
    //   endpoint: 'https://api.example.com',
    //   timeout: 5000,
    //   debug: true,
    // }),

    CccModule.registerAsync({
      useFactory: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          apiKey: '1234567890',
          endpoint: 'https://api.example.com',
          timeout: 5000,
          debug: true,
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
