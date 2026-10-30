import { Module } from '@nestjs/common';
import { SERVER_ENV, type ServerEnv } from '../../core/config';
import { RateLimitGuard } from './rate-limit.guard';
@Module({
  providers: [
    { provide: 'RATE_LIMIT_TRUST_PROXY', useFactory: (env: ServerEnv) => env.TRUST_PROXY, inject: [SERVER_ENV] },
    RateLimitGuard,
  ],
  exports: [RateLimitGuard, 'RATE_LIMIT_TRUST_PROXY'],
})
export class RateLimitModule {}
