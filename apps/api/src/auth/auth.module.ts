import { Module } from '@nestjs/common';

import { AuthTokenService } from './auth-token.service';
import { AUTH_TOKEN_SECRET } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BearerAuthGuard } from './bearer-auth.guard';
import { PasswordHasherService } from './password-hasher.service';
import { DatabaseModule } from '../core/database';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    BearerAuthGuard,
    PasswordHasherService,
    {
      provide: AUTH_TOKEN_SECRET,
      useFactory: () => {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
          throw new Error('JWT_SECRET is required');
        }

        return secret;
      },
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
