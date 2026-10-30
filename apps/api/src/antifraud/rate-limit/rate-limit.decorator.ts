import { SetMetadata } from '@nestjs/common';

export type RateLimitScope = 'ip' | 'user' | 'user-resource';

export type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
  scope: RateLimitScope;
  resourceParam?: string;
};

export const RATE_LIMIT_METADATA_KEY = 'rate-limit-options';

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_METADATA_KEY, options);
