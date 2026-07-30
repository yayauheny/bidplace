import { Module } from '@nestjs/common';

import { AuthTokenService } from './auth-token.service';
import { AUTH_TOKEN_SECRET } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BearerAuthGuard } from './bearer-auth.guard';
import { LogoutAuthGuard } from './logout-auth.guard';
import { OptionalBearerAuthGuard } from './optional-bearer-auth.guard';
import { PasswordHasherService } from './password-hasher.service';
import { loadServerEnv } from '../core/config';
import { DatabaseModule } from '../core/database';
import { RateLimitModule } from '../core/rate-limit';

@Module({
  imports: [DatabaseModule, RateLimitModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    BearerAuthGuard,
    LogoutAuthGuard,
    OptionalBearerAuthGuard,
    PasswordHasherService,
    {
      provide: AUTH_TOKEN_SECRET,
      useFactory: () => loadServerEnv().JWT_SECRET,
    },
  ],
  exports: [
    AuthService,
    AuthTokenService,
    BearerAuthGuard,
    LogoutAuthGuard,
    OptionalBearerAuthGuard,
  ],
})
export class AuthModule {}
