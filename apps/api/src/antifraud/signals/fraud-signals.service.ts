import { randomUUID } from 'node:crypto';
import {
  ApiErrorCode,
  adminUserStatusUpdateRequestSchema,
  type AdminUserStatusUpdateRequest,
} from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  PrismaService,
  runReadCommittedTransaction,
  runSerializableTransaction,
} from '../../core/database';
import { AppException } from '../../core/errors';
import { MediaLifecycleService } from '../../core/media/media-lifecycle.service';
import { dbNow } from '../../core/time';
import { parseBody } from '../../core/validation';
import {
  BID_BURST_WINDOW_MS,
  FRAUD_SIGNAL_WINDOW_MS,
  buyerReservationLimitReached,
  buyerStrikesBlock,
  detectBidBurst,
  hasBuyerContact,
  isActiveBuyerStrike,
  shouldHold,
  strikeMark,
  type ActorAction,
  type SignalKind,
} from '../antifraud.policy';

export type BanHook = {
  lockProducts(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<readonly string[]>;
  voidBids(
    tx: Prisma.TransactionClient,
    userId: string,
    lockedProductIds: ReadonlySet<string>,
  ): Promise<void>;
};

const userSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  status: true,
} as const;

// Prisma stores timestamp(3) as UTC wall time. clock_timestamp() is
// timestamptz; casting it directly follows the session TimeZone.
const utcTimestamp3 = Prisma.sql`(clock_timestamp() AT TIME ZONE 'UTC')::timestamp(3)`;

@Injectable()
export class FraudSignalsService {
  private readonly banHooks: BanHook[] = [];

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(MediaLifecycleService)
    private readonly media?: MediaLifecycleService,
  ) {}

  // Caller transaction: READ COMMITTED (default) or SERIALIZABLE retried as a
  // whole via runSerializableTransaction. Repeatable Read is still unsupported.
  // Each recordSignal touches the user row after this lock so a stale
  // Serializable snapshot conflicts and retries. updated_at is
  // GREATEST(updated_at, utc timestamp(3)): now() is frozen at transaction
  // start and can move the column backwards. Signal time is that same UTC
  // timestamp(3), taken after the lock. The lock is held until the caller
  // commits or rolls back. The window lower bound is inclusive and has no
  // upper bound. Ids are locked in ascending order. Status changes, hold
  // release, and session revoke take this lock on the admin and the target
  // before any user mutation or audit insert.
  async lockUsers(tx: Prisma.TransactionClient, userIds: string[]) {
    await tx.$queryRaw`SELECT id FROM users WHERE id IN (${Prisma.join(userIds.map((id) => Prisma.sql`${id}::uuid`))}) ORDER BY id FOR UPDATE`;
  }

  async recordSignal(
    tx: Prisma.TransactionClient,
    signal: { userId: string; kind: SignalKind; subjectId?: string },
  ): Promise<void> {
    await this.lockUsers(tx, [signal.userId]);
    await tx.$executeRaw`UPDATE users SET updated_at = GREATEST(updated_at, ${utcTimestamp3}) WHERE id = ${signal.userId}::uuid`;
    if (
      !(await tx.user.findUnique({
        where: { id: signal.userId },
        select: { id: true },
      }))
    )
      throw new NotFoundException('User not found');
    const [inserted] = await tx.$queryRaw<{ now: string }[]>`
      INSERT INTO fraud_signals (id, user_id, kind, subject_id, created_at)
      VALUES (
        ${randomUUID()}::uuid,
        ${signal.userId}::uuid,
        CAST(${signal.kind} AS "FraudSignalKind"),
        ${signal.subjectId ?? null}::uuid,
        ${utcTimestamp3}
      )
      RETURNING to_char((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS.MS') AS now
    `;
    const signalAt = inserted!.now;
    const kinds = await tx.$queryRaw<{ kind: SignalKind }[]>`
      SELECT DISTINCT kind FROM fraud_signals WHERE user_id = ${signal.userId}::uuid
      AND created_at >= ((${signalAt}::timestamp(3) AT TIME ZONE 'UTC') AT TIME ZONE 'UTC') - ${FRAUD_SIGNAL_WINDOW_MS} * interval '1 millisecond'
    `;
    if (!shouldHold(kinds.map((row) => row.kind))) return;
    if (
      await tx.purchaseHold.findFirst({
        where: { userId: signal.userId, releasedAt: null },
        select: { id: true },
      })
    )
      return;
    await tx.purchaseHold.create({
      data: { userId: signal.userId, reason: 'FRAUD_REVIEW' },
    });
    await tx.auditEvent.create({
      data: {
        targetType: 'USER',
        targetId: signal.userId,
        oldStatus: 'clear',
        newStatus: 'held',
        reason: 'FRAUD_REVIEW',
        action: 'FRAUD_HOLD',
      },
    });
  }

  registerBanHook(hook: BanHook): () => void {
    this.banHooks.push(hook);
    return () => {
      const index = this.banHooks.lastIndexOf(hook);
      if (index >= 0) this.banHooks.splice(index, 1);
    };
  }

  async recordPurchaseSignals(
    tx: Prisma.TransactionClient,
    input: {
      userId: string;
      listingId: string;
      sellerUserId: string;
      turnstile: 'passed' | 'failed' | 'missing' | 'skip';
      browserId: string | null;
    },
  ): Promise<void> {
    await this.recordTurnstileAndSharedBrowser(tx, input);
  }

  async recordBidSignals(
    tx: Prisma.TransactionClient,
    input: {
      userId: string;
      listingId: string;
      sellerUserId: string;
      bidCreatedAt: Date;
      turnstile: 'passed' | 'failed' | 'missing' | 'skip';
      browserId: string | null;
    },
  ): Promise<void> {
    await this.recordTurnstileAndSharedBrowser(tx, input);
    const recent = await tx.bid.findMany({
      where: {
        bidderUserId: input.userId,
        createdAt: {
          gte: new Date(input.bidCreatedAt.getTime() - BID_BURST_WINDOW_MS),
        },
      },
      select: { listingId: true, createdAt: true },
    });
    if (
      detectBidBurst(
        recent.map((row) => ({ listingId: row.listingId, at: row.createdAt })),
        input.bidCreatedAt,
      )
    ) {
      await this.recordSignal(tx, {
        userId: input.userId,
        kind: 'BID_BURST',
        subjectId: input.listingId,
      });
    }
  }

  private async recordTurnstileAndSharedBrowser(
    tx: Prisma.TransactionClient,
    input: {
      userId: string;
      listingId: string;
      sellerUserId: string;
      turnstile: 'passed' | 'failed' | 'missing' | 'skip';
      browserId: string | null;
    },
  ): Promise<void> {
    if (input.turnstile === 'failed' || input.turnstile === 'missing') {
      await this.recordSignal(tx, {
        userId: input.userId,
        kind: 'TURNSTILE_FAILED',
        subjectId: input.listingId,
      });
    }
    if (
      input.browserId &&
      (await sharesBrowser(tx, input.browserId, input.sellerUserId))
    ) {
      await this.recordSignal(tx, {
        userId: input.userId,
        kind: 'SHARED_BROWSER_WITH_SELLER',
        subjectId: input.listingId,
      });
    }
  }

  async assertCanAct(
    tx: Prisma.TransactionClient,
    userId: string,
    action: ActorAction,
  ): Promise<void> {
    if (!(['bid', 'purchase', 'accept-offer'] as const).includes(action))
      throw new BadRequestException('Unknown actor action');
    await this.lockUsers(tx, [userId]);
    const now = await dbNow(tx);
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        status: true,
        emailVerifiedAt: true,
        contactPhone: true,
        contactTelegram: true,
        contactInstagram: true,
        contactVk: true,
        purchaseHolds: {
          where: { releasedAt: null },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!user || user.status !== 'active' || user.purchaseHolds.length > 0) {
      throw new AppException({
        status: 403,
        code: ApiErrorCode.BUYER_BLOCKED,
        message: 'Purchases are blocked',
      });
    }
    if (!user.emailVerifiedAt)
      throw new AppException({
        status: 403,
        code: ApiErrorCode.EMAIL_VERIFICATION_REQUIRED,
        message: 'Email verification required',
      });
    if (
      !hasBuyerContact([
        user.contactPhone,
        user.contactTelegram,
        user.contactInstagram,
        user.contactVk,
      ])
    ) {
      throw new AppException({
        status: 403,
        code: ApiErrorCode.BUYER_CONTACTS_REQUIRED,
        message: 'Buyer contacts are required',
      });
    }
    if (buyerStrikesBlock(await this.activeStrikeCount(tx, userId, now))) {
      throw new AppException({
        status: 403,
        code: ApiErrorCode.BUYER_BLOCKED,
        message: 'Purchases are blocked',
      });
    }
    if (buyerReservationLimitReached(await this.reservationCount(tx, userId))) {
      throw new AppException({
        status: 403,
        code: ApiErrorCode.BUYER_ORDER_LIMIT,
        message: 'Buyer active order limit is reached',
      });
    }
  }

  async isPurchaseBlocked(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<boolean> {
    await this.lockUsers(tx, [userId]);
    const now = await dbNow(tx);
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        status: true,
        role: true,
        purchaseHolds: {
          where: { releasedAt: null },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (
      !user ||
      user.status !== 'active' ||
      user.role === 'admin' ||
      user.purchaseHolds.length > 0
    ) {
      return true;
    }
    return buyerStrikesBlock(await this.activeStrikeCount(tx, userId, now));
  }

  private async activeStrikeCount(
    tx: Prisma.TransactionClient,
    userId: string,
    now: Date,
  ): Promise<number> {
    const orders = await tx.order.findMany({
      where: {
        buyerUserId: userId,
        status: 'FAILED',
        faultSide: 'BUYER',
        strikeVoidedAt: null,
      },
      select: { id: true, failReason: true, failedAt: true, failedBy: true },
    });
    if (orders.length === 0) return 0;
    const reports = await tx.report.findMany({
      where: {
        targetType: 'ORDER',
        targetId: { in: orders.map((order) => order.id) },
        reporterUserId: userId,
        status: 'OPEN',
      },
      select: { targetId: true },
    });
    const open = new Set(reports.map((report) => report.targetId));
    return orders.filter((order) =>
      isActiveBuyerStrike(
        {
          failReason: order.failReason,
          failedAt: order.failedAt,
          buyerReportOpen: open.has(order.id),
          markedBy: strikeMark(order.failedBy),
        },
        now,
      ),
    ).length;
  }

  private async reservationCount(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<number> {
    const [row] = await tx.$queryRaw<Array<{ reservations: number }>>`
      SELECT (
        (SELECT COUNT(*) FROM orders WHERE buyer_user_id = ${userId}::uuid AND status = 'ACTIVE'::"OrderStatus")
        +
        (SELECT COUNT(*) FROM listings l
          WHERE l.type = 'AUCTION'::"ListingType"
            AND l.status IN ('SCHEDULED'::"ListingStatus", 'LIVE'::"ListingStatus")
            AND l.id IN (
              SELECT b.listing_id FROM bids b
              WHERE b.bidder_user_id = ${userId}::uuid AND b.voided_at IS NULL
            )
            AND (
              SELECT b2.bidder_user_id FROM bids b2
              WHERE b2.listing_id = l.id AND b2.voided_at IS NULL
              ORDER BY b2.amount_minor DESC, b2.created_at ASC
              LIMIT 1
            ) = ${userId}::uuid)
      )::int AS reservations
    `;
    return Number(row?.reservations ?? 0);
  }

  private async assertAdmin(tx: Prisma.TransactionClient, adminId: string) {
    const admin = await tx.user.findUnique({
      where: { id: adminId },
      select: { role: true, status: true },
    });
    if (admin?.role !== 'admin' || admin.status !== 'active')
      throw new ForbiddenException('Active admin required');
  }

  async releaseHold(
    adminId: string,
    userId: string,
    note: string,
  ): Promise<void> {
    if (typeof note !== 'string' || !note.trim())
      throw new BadRequestException('Review note required');
    await runSerializableTransaction(this.prisma, async (tx) => {
      await this.lockUsers(tx, [adminId, userId]);
      await this.assertAdmin(tx, adminId);
      if (
        !(await tx.user.findUnique({
          where: { id: userId },
          select: { id: true },
        }))
      )
        throw new NotFoundException('User not found');
      const hold = await tx.purchaseHold.findFirst({
        where: { userId, releasedAt: null },
        select: { id: true },
      });
      if (!hold) return;
      const [clock] = await tx.$queryRaw<{ now: Date }[]>`SELECT now() AS now`;
      await tx.purchaseHold.update({
        where: { id: hold.id },
        data: {
          releasedAt: clock!.now,
          releasedById: adminId,
          note: note.trim(),
        },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: adminId,
          targetType: 'USER',
          targetId: userId,
          oldStatus: 'held',
          newStatus: 'released',
          reason: note.trim(),
          action: 'FRAUD_HOLD_RELEASE',
        },
      });
    });
  }

  async updateUserStatus(
    adminId: string,
    userId: string,
    request: AdminUserStatusUpdateRequest,
  ) {
    const input = parseBody(adminUserStatusUpdateRequestSchema, request);
    let profileId: string | undefined;
    const run =
      input.status === 'banned'
        ? runReadCommittedTransaction
        : runSerializableTransaction;
    const updatedUser = await run(
      this.prisma,
      async (tx) => {
        profileId = undefined;
        const prepared: Array<{ hook: BanHook; ids: readonly string[] }> = [];
        if (input.status === 'banned') {
          for (const hook of this.banHooks) {
            prepared.push({
              hook,
              ids: await hook.lockProducts(tx, userId),
            });
          }
        }
        await this.lockUsers(tx, [adminId, userId]);
        await this.assertAdmin(tx, adminId);
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: userSelect,
        });
        if (!user) throw new NotFoundException('User not found');
        if (user.id === adminId)
          throw new ForbiddenException(
            'Admins cannot change their own account status',
          );
        if (user.role === 'admin')
          throw new ForbiddenException(
            'Admin accounts cannot be banned or unbanned through emergency controls',
          );
        const voidAfterBan = async () => {
          if (input.status !== 'banned') return;
          for (const item of prepared) {
            await item.hook.voidBids(tx, userId, new Set(item.ids));
          }
        };
        if (user.status === input.status) {
          await voidAfterBan();
          return user;
        }
        if (input.status === 'banned' && this.media?.enabled) {
          const profile = await tx.sellerProfile.findUnique({
            where: { userId },
            select: { id: true },
          });
          if (profile) {
            profileId = profile.id;
            await this.media.enqueueRevoke(tx, { profileId });
          }
        }
        const updated = await tx.user.update({
          where: { id: userId },
          data: {
            status: input.status,
            ...(input.status === 'banned'
              ? { sessionVersion: { increment: 1 } }
              : {}),
          },
          select: userSelect,
        });
        await tx.auditEvent.create({
          data: {
            actorUserId: adminId,
            targetType: 'USER',
            targetId: userId,
            oldStatus: user.status,
            newStatus: input.status,
            reason: input.reason,
          },
        });
        await voidAfterBan();
        return updated;
      },
    );
    if (profileId && this.media?.enabled)
      await this.media.deliverOutstanding({ profileId }, 'REVOKE');
    return updatedUser;
  }

  async banUser(
    adminId: string,
    userId: string,
    reason: string,
  ): Promise<void> {
    await this.updateUserStatus(adminId, userId, { status: 'banned', reason });
  }
}

async function sharesBrowser(
  tx: Prisma.TransactionClient,
  browserId: string,
  sellerUserId: string,
): Promise<boolean> {
  const event = await tx.analyticsEvent.findFirst({
    where: { anonymousId: browserId, userId: sellerUserId },
    select: { id: true },
  });
  if (event) return true;
  const attribution = await tx.acquisitionAttribution.findFirst({
    where: {
      anonymousId: browserId,
      OR: [{ registeredUserId: sellerUserId }, { userId: sellerUserId }],
    },
    select: { id: true },
  });
  return attribution !== null;
}
