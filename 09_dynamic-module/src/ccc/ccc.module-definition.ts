import { ConfigurableModuleBuilder } from '@nestjs/common';

export interface CccModuleOptions {
  apiKey?: string;
  endpoint: string;
  timeout?: number;
  debug?: boolean;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<CccModuleOptions>()
    // .setClassMethodName('forRoot')
    .setClassMethodName('register')
    .build();
