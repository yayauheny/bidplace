import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitServiceConfig = {
  maxBuckets: number;
  cleanupIntervalMs: number;
};

@Injectable()
export class RateLimitService implements OnModuleDestroy {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private readonly cleanupTimer: NodeJS.Timeout;

  private readonly config: RateLimitServiceConfig;

  constructor(
    @Inject('RATE_LIMIT_SERVICE_CONFIG')
    config: RateLimitServiceConfig,
  ) {
    this.config = config;
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredBuckets(Date.now());
    }, this.config.cleanupIntervalMs);
    this.cleanupTimer.unref?.();
  }

  consume(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
    this.cleanupExpiredBuckets(now);

    const bucket = this.buckets.get(key);

    if (!bucket) {
      this.ensureCapacity(now);
      this.buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });

      return true;
    }

    if (bucket.count >= limit) {
      return false;
    }

    bucket.count += 1;
    return true;
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupTimer);
  }

  private cleanupExpiredBuckets(now: number): void {
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }

  private ensureCapacity(now: number): void {
    this.cleanupExpiredBuckets(now);

    if (this.buckets.size < this.config.maxBuckets) {
      return;
    }

    let oldestBucketKey: string | null = null;
    let oldestResetAt = Number.POSITIVE_INFINITY;

    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt < oldestResetAt) {
        oldestBucketKey = key;
        oldestResetAt = bucket.resetAt;
      }
    }

    if (oldestBucketKey) {
      this.buckets.delete(oldestBucketKey);
    }
  }
}
