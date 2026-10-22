import { Module } from '@nestjs/common';
import { DatabaseModule } from '../core/database';
import { RateLimitModule } from '../core/rate-limit';
import { AuthModule } from './auth.module';
import { AuthFlowService } from './auth-flow.service';
import { OidcProvidersService } from './oidc-providers.service';
import { SocialAuthController } from './social-auth.controller';

@Module({
  imports: [DatabaseModule, RateLimitModule, AuthModule],
  providers: [AuthFlowService, OidcProvidersService],
  controllers: [SocialAuthController],
})
export class SocialAuthModule {}
