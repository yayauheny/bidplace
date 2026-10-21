import { Module } from '@nestjs/common';

import { SessionService } from './session.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './session-auth.guard';
import { LogoutAuthGuard } from './logout-auth.guard';
import { OptionalSessionAuthGuard } from './optional-session-auth.guard';
import { PasswordHasherService } from './password-hasher.service';
import { VerifiedEmailGuard } from './verified-email.guard';
import { DatabaseModule } from '../core/database';
import { RateLimitModule } from '../core/rate-limit';

@Module({
  imports: [DatabaseModule, RateLimitModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    SessionAuthGuard,
    LogoutAuthGuard,
    OptionalSessionAuthGuard,
    PasswordHasherService,
    VerifiedEmailGuard,
  ],
  exports: [
    AuthService,
    SessionService,
    SessionAuthGuard,
    LogoutAuthGuard,
    OptionalSessionAuthGuard,
    PasswordHasherService,
    VerifiedEmailGuard,
  ],
})
export class AuthModule {}
