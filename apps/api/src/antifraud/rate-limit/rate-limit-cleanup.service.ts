import { Injectable, type OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../core/database';
import { TickService } from '../../core/tick/tick.service';
import { RATE_LIMIT_RETENTION_MS } from '../antifraud.policy';
@Injectable()
export class RateLimitCleanupService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService, private readonly tick: TickService) {}
  onModuleInit(): void {
    this.tick.register({ name: 'antifraud-cleanup', run: async (now, budget) => Date.now() >= budget.deadline ? 0 : this.cleanup(now) });
  }
  cleanup(now: Date): Promise<number> {
    const cutoff = new Date(now.getTime() - RATE_LIMIT_RETENTION_MS);
    return this.prisma.$executeRaw`DELETE FROM rate_limit_counters WHERE key IN (SELECT key FROM rate_limit_counters WHERE window_start < ${cutoff} AND expires_at <= ${now} ORDER BY window_start LIMIT 1000 FOR UPDATE SKIP LOCKED)`;
  }
}
