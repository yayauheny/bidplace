import { Global, Module } from '@nestjs/common';

import { loadServerEnv, requiresProductionSecurity } from '../config';
import { LocalMailTransport } from './local-mail-transport';
import { MailTransport } from './mail-transport';
import { SmtpMailTransport } from './smtp-mail-transport';

@Global()
@Module({
  providers: [
    {
      provide: MailTransport,
      useFactory: () => {
        const env = loadServerEnv();

        if (requiresProductionSecurity(env)) {
          return SmtpMailTransport.create(env);
        }

        return new LocalMailTransport();
      },
    },
  ],
  exports: [MailTransport],
})
export class MailModule {}
