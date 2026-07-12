import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { AuctionClosingService } from './auction-closing.service';

@Injectable()
export class AuctionClosingScheduler implements OnModuleInit, OnModuleDestroy {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly auctionClosingService: AuctionClosingService,
  ) {}

  onModuleInit() {
    this.intervalId = setInterval(() => {
      void this.auctionClosingService.closeExpiredAuctions();
    }, 60_000);
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
