import { Module } from '@nestjs/common';

import { SessionService } from './session.service';
import { AuthController } from './auth.controller';
import { ContactsController } from './contacts.controller';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './session-auth.guard';
import { LogoutAuthGuard } from './logout-auth.guard';
import { OptionalSessionAuthGuard } from './optional-session-auth.guard';
import { PasswordHasherService } from './password-hasher.service';
import { EmailProofService } from './email-proof.service';
import { VerifiedEmailGuard } from './verified-email.guard';
import { DatabaseModule } from '../core/database';
import { RateLimitModule } from '../antifraud';

@Module({
  imports: [DatabaseModule, RateLimitModule],
  controllers: [AuthController, ContactsController],
  providers: [
    AuthService,
    SessionService,
    SessionAuthGuard,
    LogoutAuthGuard,
    OptionalSessionAuthGuard,
    PasswordHasherService,
    EmailProofService,
    VerifiedEmailGuard,
  ],
  exports: [
    AuthService,
    SessionService,
    SessionAuthGuard,
    LogoutAuthGuard,
    OptionalSessionAuthGuard,
    PasswordHasherService,
    EmailProofService,
    VerifiedEmailGuard,
  ],
})
export class AuthModule {}
