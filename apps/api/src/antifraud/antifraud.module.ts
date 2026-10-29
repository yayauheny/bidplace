import { Global, Module } from '@nestjs/common';

import { DatabaseModule } from '../core/database';
import { TickModule } from '../core/tick/tick.module';
import { RateLimitService } from './rate-limit/rate-limit.service';
import { RateLimitCleanupService } from './rate-limit/rate-limit-cleanup.service';
import { AuthAbuseModule } from './auth/auth-abuse.module';
import { AntifraudService } from './antifraud.service';

@Global()
@Module({
  imports: [AuthAbuseModule, DatabaseModule, TickModule],
  providers: [AntifraudService, RateLimitService, RateLimitCleanupService],
  exports: [AntifraudService],
})
export class AntifraudModule {}
