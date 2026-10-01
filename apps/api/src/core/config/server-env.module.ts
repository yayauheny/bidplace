import { Module, type DynamicModule } from '@nestjs/common';

import { SERVER_ENV, type ServerEnv } from './env';

@Module({})
export class ServerEnvModule {
  static forRoot(env: ServerEnv): DynamicModule {
    return {
      module: ServerEnvModule,
      global: true,
      providers: [
        {
          provide: SERVER_ENV,
          useValue: env,
        },
      ],
      exports: [SERVER_ENV],
    };
  }
}
