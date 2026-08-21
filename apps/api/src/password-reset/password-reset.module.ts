import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { loadServerEnv } from '../core/config';
import { DatabaseModule } from '../core/database';
import { RateLimitModule } from '../core/rate-limit';
import { PasswordResetController } from './password-reset.controller';
import {
  LocalPasswordResetTransport,
  PasswordResetTransport,
  SmtpPasswordResetTransport,
} from './password-reset.transport';
import { PasswordResetService } from './password-reset.service';

@Module({
  imports: [AuthModule, DatabaseModule, RateLimitModule],
  controllers: [PasswordResetController],
  providers: [
    PasswordResetService,
    {
      provide: PasswordResetTransport,
      useFactory: () => {
        const env = loadServerEnv();

        if (env.NODE_ENV === 'production') {
          return SmtpPasswordResetTransport.create(env);
        }

        return new LocalPasswordResetTransport();
      },
    },
  ],
})
export class PasswordResetModule {}
