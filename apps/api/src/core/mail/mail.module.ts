import { Global, Module } from '@nestjs/common';

import {
  SERVER_ENV,
  type ServerEnv,
  requiresProductionSecurity,
} from '../config';
import { LocalMailTransport } from './local-mail-transport';
import { MailTransport } from './mail-transport';
import { SmtpMailTransport } from './smtp-mail-transport';

@Global()
@Module({
  providers: [
    {
      provide: MailTransport,
      useFactory: (env: ServerEnv) => {
        if (requiresProductionSecurity(env)) {
          return SmtpMailTransport.create(env);
        }

        return new LocalMailTransport(env);
      },
      inject: [SERVER_ENV],
    },
  ],
  exports: [MailTransport],
})
export class MailModule {}
