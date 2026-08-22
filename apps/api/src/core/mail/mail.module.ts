import { Global, Module } from '@nestjs/common';

import { loadServerEnv } from '../config';
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

        if (env.NODE_ENV === 'production') {
          return SmtpMailTransport.create(env);
        }

        return new LocalMailTransport();
      },
    },
  ],
  exports: [MailTransport],
})
export class MailModule {}
