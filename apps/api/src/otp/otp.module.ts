import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { DatabaseModule } from '../core/database';
import { MailModule } from '../core/mail';
import { RateLimitModule } from '../core/rate-limit';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

@Module({
  imports: [AuthModule, DatabaseModule, MailModule, RateLimitModule],
  controllers: [OtpController],
  providers: [OtpService],
})
export class OtpModule {}
