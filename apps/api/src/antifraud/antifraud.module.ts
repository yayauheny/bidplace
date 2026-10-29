import { Global, Module } from '@nestjs/common';

import { AuthAbuseModule } from './auth/auth-abuse.module';
import { AntifraudService } from './antifraud.service';

@Global()
@Module({
  imports: [AuthAbuseModule],
  providers: [AntifraudService],
  exports: [AntifraudService],
})
export class AntifraudModule {}
