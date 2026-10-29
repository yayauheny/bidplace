import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { Clock } from '../time';

export type TickJob = {
  name: string;
  run(now: Date, budget: { deadline: number }): Promise<number>;
};
export type TickResult = {
  skipped: boolean;
  jobs: { name: string; processed: number; failed: boolean }[];
};

@Injectable()
export class TickService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(TickService.name);
  private readonly jobs: TickJob[] = [];
  private running = false;
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
  ) {}

  register(job: TickJob): void {
    this.jobs.push(job);
  }

  onApplicationBootstrap(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.run().catch(() => this.logger.error('Scheduled tick failed'));
    }, 30_000);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }

  async run(now = this.clock.now()): Promise<TickResult> {
    if (this.running) return { skipped: true, jobs: [] };
    this.running = true;
    const deadline = this.clock.now().getTime() + 20_000;
    const jobs: TickResult['jobs'] = [];
    try {
      for (const job of this.jobs) {
        if (this.clock.now().getTime() >= deadline) {
          jobs.push({ name: job.name, processed: 0, failed: false });
          continue;
        }
        try {
          const processed = await job.run(now, { deadline });
          jobs.push({ name: job.name, processed, failed: false });
        } catch {
          this.logger.error(`Tick job failed: ${job.name}`);
          jobs.push({ name: job.name, processed: 0, failed: true });
        }
      }
      if (
        !jobs.some((job) => job.failed) &&
        this.clock.now().getTime() < deadline
      ) {
        await this.prisma.$executeRaw`
          INSERT INTO system_heartbeats (name, at) VALUES ('tick', now())
          ON CONFLICT (name) DO UPDATE SET at = now()
        `;
      }
      return { skipped: false, jobs };
    } finally {
      this.running = false;
    }
  }

  async lastSucceededAt(): Promise<Date | null> {
    const heartbeat = await this.prisma.systemHeartbeat.findUnique({
      where: { name: 'tick' },
    });
    return heartbeat?.at ?? null;
  }
}
