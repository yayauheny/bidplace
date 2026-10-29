import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database';

@Injectable()
export class RateLimitService {
  constructor(private readonly prisma: PrismaService) {}
  async consume(key: string, limit: number, windowMs: number): Promise<boolean> {
    if (key.length > 200 || !Number.isSafeInteger(limit) || limit < 1 || limit >= 2147483647 || !Number.isSafeInteger(windowMs) || windowMs < 1) throw new RangeError('Invalid rate limit parameters');
    const [counter] = await this.prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO rate_limit_counters (key, window_start, expires_at, count)
      VALUES (${key}, statement_timestamp(), statement_timestamp() + ${windowMs} * interval '1 millisecond', 1)
      ON CONFLICT (key) DO UPDATE SET
        window_start = CASE WHEN rate_limit_counters.expires_at <= statement_timestamp() THEN statement_timestamp() ELSE rate_limit_counters.window_start END,
        expires_at = CASE WHEN rate_limit_counters.expires_at <= statement_timestamp() THEN statement_timestamp() + ${windowMs} * interval '1 millisecond' ELSE rate_limit_counters.expires_at END,
        count = CASE WHEN rate_limit_counters.expires_at <= statement_timestamp() THEN 1 ELSE LEAST(rate_limit_counters.count::bigint + 1, 2147483647)::integer END
      RETURNING count
    `;
    if (!counter) throw new Error('Rate limit counter was not returned');
    return counter.count <= limit;
  }
}
