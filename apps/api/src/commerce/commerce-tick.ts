import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';

import { AntifraudService } from '../antifraud';
import { PrismaService, runReadCommittedTransaction } from '../core/database';
import { dbNow } from '../core/time';
import { TickService } from '../core/tick/tick.service';
import { enqueueNotification } from '../notifications/notification-outbox';
import { lockProductRowForUpdate } from '../products/product-write-guard';
import { CommerceGuards } from './commerce-guards';
import { effectiveListingState } from './listing-state';
import { rankBidders } from './order-offers';
import { OrdersService } from './orders.service';

const BATCH_LIMIT = 50;
const HOUR_MS = 60 * 60 * 1000;

type DueRow = { id: string; productId: string };

const bidSelect = {
  id: true,
  bidderUserId: true,
  amountMinor: true,
  createdAt: true,
  voidedAt: true,
} as const;

@Injectable()
export class CommerceTickService implements OnModuleInit {
  private readonly logger = new Logger(CommerceTickService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tick: TickService,
    private readonly orders: OrdersService,
    private readonly antifraud: AntifraudService,
    private readonly guards: CommerceGuards,
  ) {}

  onModuleInit(): void {
    this.tick.register({
      name: 'commerce.activate',
      run: (_now, budget) => this.activateDue(budget.deadline),
    });
    this.tick.register({
      name: 'commerce.close',
      run: (_now, budget) => this.closeDue(budget.deadline),
    });
    this.tick.register({
      name: 'commerce.offers',
      run: (_now, budget) => this.expireDue(budget.deadline),
    });
    this.tick.register({
      name: 'commerce.reminders',
      run: (_now, budget) => this.remindDue(budget.deadline),
    });
  }

  async activateDue(deadline: number): Promise<number> {
    if (Date.now() >= deadline) return 0;
    const rows = await this.prisma.$queryRaw<DueRow[]>`
      SELECT id, product_id AS "productId"
      FROM listings
      WHERE status = 'SCHEDULED'::"ListingStatus"
        AND starts_at <= clock_timestamp()
      ORDER BY starts_at, id
      LIMIT ${BATCH_LIMIT}
    `;
    return this.each('commerce.activate', rows, deadline, (row) =>
      this.activateOne(row),
    );
  }

  async closeDue(deadline: number): Promise<number> {
    if (Date.now() >= deadline) return 0;
    const rows = await this.prisma.$queryRaw<DueRow[]>`
      SELECT id, product_id AS "productId"
      FROM listings
      WHERE status = 'LIVE'::"ListingStatus"
        AND type = 'AUCTION'::"ListingType"
        AND ends_at <= clock_timestamp()
      ORDER BY ends_at, id
      LIMIT ${BATCH_LIMIT}
    `;
    return this.each('commerce.close', rows, deadline, (row) =>
      this.closeOne(row),
    );
  }

  async expireDue(deadline: number): Promise<number> {
    if (Date.now() >= deadline) return 0;
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM orders
      WHERE status = 'OFFERED'::"OrderStatus"
        AND offer_expires_at <= clock_timestamp()
      ORDER BY offer_expires_at, id
      LIMIT ${BATCH_LIMIT}
    `;
    let processed = 0;
    let failed = 0;
    for (const row of rows) {
      if (Date.now() >= deadline) break;
      try {
        if (await this.orders.expireOffered(row.id)) processed += 1;
      } catch (error) {
        failed += 1;
        this.logFailure('commerce.offers', row.id, error);
      }
    }
    if (failed > 0) {
      throw new Error(`commerce.offers failed for ${failed} record(s)`);
    }
    return processed;
  }

  async remindDue(deadline: number): Promise<number> {
    if (Date.now() >= deadline) return 0;
    const rows = await this.prisma.$queryRaw<DueRow[]>`
      SELECT id, product_id AS "productId"
      FROM orders
      WHERE status = 'ACTIVE'::"OrderStatus"
        AND activated_at IS NOT NULL
        AND (
          (
            seller_reminders_sent = 0
            AND activated_at <= clock_timestamp() - interval '24 hours'
          )
          OR (
            seller_reminders_sent = 1
            AND activated_at <= clock_timestamp() - interval '48 hours'
          )
        )
      ORDER BY activated_at, id
      LIMIT ${BATCH_LIMIT}
    `;
    return this.each('commerce.reminders', rows, deadline, (row) =>
      this.remindOne(row),
    );
  }

  private async each(
    job: string,
    rows: DueRow[],
    deadline: number,
    work: (row: DueRow) => Promise<boolean>,
  ): Promise<number> {
    let processed = 0;
    let failed = 0;
    for (const row of rows) {
      if (Date.now() >= deadline) break;
      try {
        if (await work(row)) processed += 1;
      } catch (error) {
        failed += 1;
        this.logFailure(job, row.id, error);
      }
    }
    if (failed > 0) throw new Error(`${job} failed for ${failed} record(s)`);
    return processed;
  }

  private logFailure(job: string, id: string, error: unknown): void {
    const name = error instanceof Error ? error.name : 'Error';
    const message = error instanceof Error ? error.message : 'Unknown failure';
    this.logger.error(`${job} ${id} ${name}: ${message}`);
  }

  private async activateOne(row: DueRow): Promise<boolean> {
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      await lockProductRowForUpdate(tx, row.productId);
      const now = await dbNow(tx);
      const updated = await tx.listing.updateMany({
        where: { id: row.id, status: 'SCHEDULED', startsAt: { lte: now } },
        data: { status: 'LIVE' },
      });
      return updated.count === 1;
    });
  }

  private async closeOne(row: DueRow): Promise<boolean> {
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      await lockProductRowForUpdate(tx, row.productId);
      const preview = await tx.listing.findUnique({
        where: { id: row.id },
        select: { id: true, status: true, type: true, sellerUserId: true },
      });
      if (!preview || preview.status !== 'LIVE' || preview.type !== 'AUCTION') {
        return false;
      }
      const previewBids = await tx.bid.findMany({
        where: { listingId: preview.id },
        select: { bidderUserId: true },
      });
      await this.antifraud.lockUsers(tx, [
        ...new Set([
          preview.sellerUserId,
          ...previewBids.map((bid) => bid.bidderUserId),
        ]),
      ]);
      const now = await dbNow(tx);
      const listing = await tx.listing.findUnique({
        where: { id: row.id },
        select: {
          id: true,
          productId: true,
          sellerUserId: true,
          currency: true,
          contactWindowHours: true,
          status: true,
          type: true,
          startsAt: true,
          endsAt: true,
        },
      });
      if (
        !listing ||
        listing.type !== 'AUCTION' ||
        effectiveListingState(listing, now) !== 'AWAITING_CLOSE'
      ) {
        return false;
      }
      const bids = await tx.bid.findMany({
        where: { listingId: listing.id },
        select: bidSelect,
      });
      const ended = await tx.listing.updateMany({
        where: {
          id: listing.id,
          type: 'AUCTION',
          status: 'LIVE',
          endsAt: { lte: now },
        },
        data: { status: 'ENDED', endedAt: now },
      });
      if (ended.count !== 1) return false;

      const winner = rankBidders(bids, new Set())[0];
      if (winner) {
        if (await this.guards.sellerMaySell(tx, listing.sellerUserId)) {
          await this.orders.createOrder(tx, {
            listing,
            buyerUserId: winner.userId,
            amountMinor: winner.amountMinor,
            source: 'AUCTION_WIN',
            sourceBidId: winner.bidId,
            status: 'ACTIVE',
            now,
          });
        }
        return true;
      }

      const product = await tx.product.findUnique({
        where: { id: listing.productId },
        select: { title: true },
      });
      const workTitle = product?.title?.trim();
      if (!workTitle) throw new Error('Auction close is missing the work title');
      await enqueueNotification(tx, {
        userId: listing.sellerUserId,
        kind: 'AUCTION_ENDED_NO_BIDS',
        payload: { listingId: listing.id, workTitle },
      });
      return true;
    });
  }

  private async remindOne(row: DueRow): Promise<boolean> {
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      await lockProductRowForUpdate(tx, row.productId);
      const now = await dbNow(tx);
      const order = await tx.order.findUnique({ where: { id: row.id } });
      if (!order || order.status !== 'ACTIVE' || order.activatedAt === null) {
        return false;
      }
      const sent = order.sellerRemindersSent;
      const ageMs = now.getTime() - order.activatedAt.getTime();
      const slot = reminderSlot(sent, ageMs);
      if (!slot) return false;
      const dueAt = new Date(now.getTime() - slot.hours * HOUR_MS);
      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          status: 'ACTIVE',
          sellerRemindersSent: sent,
          activatedAt: { lte: dueAt },
        },
        data: { sellerRemindersSent: slot.next },
      });
      if (updated.count !== 1) return false;
      await enqueueNotification(tx, {
        userId: order.sellerUserId,
        kind: 'CONFIRM_DEAL_REMINDER',
        payload: {
          orderPublicId: order.publicId,
          slot: slot.slot,
          workTitle: order.workTitleSnapshot,
        },
      });
      return true;
    });
  }
}

function reminderSlot(
  sent: number,
  ageMs: number,
): { slot: '24h' | '48h'; hours: number; next: number } | null {
  if (sent === 0 && ageMs >= 48 * HOUR_MS) {
    return { slot: '48h', hours: 48, next: 2 };
  }
  if (sent === 0 && ageMs >= 24 * HOUR_MS) {
    return { slot: '24h', hours: 24, next: 1 };
  }
  if (sent === 1 && ageMs >= 48 * HOUR_MS) {
    return { slot: '48h', hours: 48, next: 2 };
  }
  return null;
}
