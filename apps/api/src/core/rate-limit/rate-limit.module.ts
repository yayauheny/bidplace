import { Module } from '@nestjs/common';

import { SERVER_ENV, type ServerEnv } from '../config';
import { RateLimitGuard } from './rate-limit.guard';
import {
  type RateLimitServiceConfig,
  RateLimitService,
} from './rate-limit.service';

@Module({
  providers: [
    {
      provide: 'RATE_LIMIT_SERVICE_CONFIG',
      useFactory: (env: ServerEnv): RateLimitServiceConfig => ({
        maxBuckets: env.RATE_LIMIT_MAX_BUCKETS,
        cleanupIntervalMs: env.RATE_LIMIT_CLEANUP_INTERVAL_MS,
      }),
      inject: [SERVER_ENV],
    },
    {
      provide: 'RATE_LIMIT_TRUST_PROXY',
      useFactory: (env: ServerEnv) => env.TRUST_PROXY,
      inject: [SERVER_ENV],
    },
    RateLimitGuard,
    RateLimitService,
  ],
  exports: [
    RateLimitGuard,
    RateLimitService,
    'RATE_LIMIT_SERVICE_CONFIG',
    'RATE_LIMIT_TRUST_PROXY',
  ],
})
export class RateLimitModule {}
