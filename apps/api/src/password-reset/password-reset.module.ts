import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { DatabaseModule } from '../core/database';
import { MailModule } from '../core/mail';
import { RateLimitModule } from '../core/rate-limit';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';

@Module({
  imports: [AuthModule, DatabaseModule, MailModule, RateLimitModule],
  controllers: [PasswordResetController],
  providers: [PasswordResetService],
})
export class PasswordResetModule {}
