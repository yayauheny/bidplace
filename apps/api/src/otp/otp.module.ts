import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { loadServerEnv } from '../core/config';
import { DatabaseModule } from '../core/database';
import { RateLimitModule } from '../core/rate-limit';
import { OtpController } from './otp.controller';
import {
  LocalOtpTransport,
  OtpService,
  OtpTransport,
  SmtpOtpTransport,
} from './otp.service';

@Module({
  imports: [AuthModule, DatabaseModule, RateLimitModule],
  controllers: [OtpController],
  providers: [
    OtpService,
    {
      provide: OtpTransport,
      useFactory: () => {
        const env = loadServerEnv();

        if (env.NODE_ENV === 'production') {
          return SmtpOtpTransport.create(env);
        }

        return new LocalOtpTransport();
      },
    },
  ],
})
export class OtpModule {}
