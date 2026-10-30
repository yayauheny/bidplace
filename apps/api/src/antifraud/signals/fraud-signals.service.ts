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
import { PrismaService, runSerializableTransaction } from '../../core/database';
import { AppException } from '../../core/errors';
import { MediaLifecycleService } from '../../core/media/media-lifecycle.service';
import { parseBody } from '../../core/validation';
import {
  FRAUD_SIGNAL_WINDOW_MS,
  shouldHold,
  type ActorAction,
  type SignalKind,
} from '../antifraud.policy';

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

  async assertCanAct(
    tx: Prisma.TransactionClient,
    userId: string,
    action: ActorAction,
  ): Promise<void> {
    if (!(['bid', 'purchase', 'accept-offer'] as const).includes(action))
      throw new BadRequestException('Unknown actor action');
    await this.lockUsers(tx, [userId]);
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        status: true,
        emailVerifiedAt: true,
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
    const updatedUser = await runSerializableTransaction(
      this.prisma,
      async (tx) => {
        profileId = undefined;
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
        if (user.status === input.status) return user;
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
