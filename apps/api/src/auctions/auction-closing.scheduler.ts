import { Cron, CronExpression } from '@nestjs/schedule';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { Clock } from '../core/time';
import { AuctionLifecycleService } from './auction-closing.service';

@Injectable()
export class AuctionLifecycleScheduler {
  private readonly logger = new Logger(AuctionLifecycleScheduler.name);

  constructor(
    @Inject(AuctionLifecycleService)
    private readonly auctionLifecycleService: Pick<
      AuctionLifecycleService,
      'runLifecycleCycle'
    >,
    private readonly clock: Clock,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS, {
    waitForCompletion: true,
  })
  async runLifecycleCycle(): Promise<void> {
    const now = this.clock.now();

    try {
      await this.auctionLifecycleService.runLifecycleCycle(now);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown scheduler error';
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Auction lifecycle cycle failed: ${message}`, stack);
    }
  }
}
