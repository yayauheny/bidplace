import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';

import {
  SERVER_ENV,
  resolveCorsOrigin,
  type ServerEnv,
} from '../core/config';
import { PrismaService, runReadCommittedTransaction } from '../core/database';
import { assertSingleEmailRecipient } from '../core/email';
import { MailTransport } from '../core/mail';
import { TickService } from '../core/tick/tick.service';
import { isNotificationKind } from './notification-kinds';
import {
  NOTIFICATION_ATTEMPT_LIMIT,
  NOTIFICATION_SEND_TIMEOUT_MS,
  resolveDeliveryFailure,
  withNotificationSendTimeout,
  type NotificationPayload,
} from './notification-outbox';
import { renderNotification } from './notification-templates';

const BATCH_LIMIT = 20;

type ClaimedRow = {
  id: string;
  user_id: string;
  kind: string;
  payload: unknown;
  attempt_count: number;
};

function normalizePayload(value: unknown): NotificationPayload {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Notification payload is invalid');
  }
  const payload: NotificationPayload = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string' || typeof item === 'number') payload[key] = item;
  }
  return payload;
}

@Injectable()
export class NotificationDeliveryService implements OnModuleInit {
  private readonly logger = new Logger(NotificationDeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailTransport,
    private readonly tick: TickService,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  onModuleInit(): void {
    this.tick.register({
      name: 'notifications.send',
      run: async (_now, budget) => this.sendDue(budget.deadline),
    });
  }

  async sendDue(deadline = Date.now() + 20_000): Promise<number> {
    if (Date.now() >= deadline) return 0;
    await this.failExhausted();
    const claimed = await this.claim();
    if (claimed.length === 0) return 0;

    const users = await this.prisma.user.findMany({
      where: { id: { in: claimed.map((row) => row.user_id) } },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
    const byId = new Map(users.map((user) => [user.id, user]));
    let sent = 0;

    for (const row of claimed) {
      if (Date.now() >= deadline) break;
      const user = byId.get(row.user_id);
      if (!user?.emailVerifiedAt) {
        await this.release(row.id);
        continue;
      }
      if (await this.deliver(row, user.email)) sent += 1;
    }

    return sent;
  }

  async retryFailed(adminUserId: string): Promise<{ retried: number }> {
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      const rows = await tx.$queryRaw<{ id: string; user_id: string }[]>`
        UPDATE notification_outbox
        SET status = 'PENDING'::"NotificationOutboxStatus",
            attempt_count = 0,
            next_attempt_at = now()
        WHERE id IN (
          SELECT id
          FROM notification_outbox
          WHERE status = 'FAILED'::"NotificationOutboxStatus"
            AND created_at >= now() - interval '48 hours'
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id, user_id
      `;

      for (const row of rows) {
        await tx.auditEvent.create({
          data: {
            actorUserId: adminUserId,
            targetType: 'USER',
            targetId: row.user_id,
            action: 'NOTIFICATION_RETRY',
            oldStatus: 'FAILED',
            newStatus: 'PENDING',
            reason: row.id,
          },
        });
      }

      return { retried: rows.length };
    });
  }

  private async failExhausted(): Promise<void> {
    const rows = await this.prisma.$queryRaw<{ id: string; kind: string }[]>`
      UPDATE notification_outbox
      SET status = 'FAILED'::"NotificationOutboxStatus"
      WHERE status = 'PENDING'::"NotificationOutboxStatus"
        AND attempt_count >= ${NOTIFICATION_ATTEMPT_LIMIT}
        AND next_attempt_at <= now()
      RETURNING id, kind
    `;
    for (const row of rows) {
      this.logger.error(`Notification delivery dead id=${row.id} kind=${row.kind}`);
    }
  }

  private async claim(): Promise<ClaimedRow[]> {
    return this.prisma.$queryRaw<ClaimedRow[]>`
      WITH due AS (
        SELECT n.id
        FROM notification_outbox n
        INNER JOIN users u ON u.id = n.user_id
        WHERE n.status = 'PENDING'::"NotificationOutboxStatus"
          AND n.next_attempt_at <= now()
          AND n.attempt_count < ${NOTIFICATION_ATTEMPT_LIMIT}
          AND u.email_verified_at IS NOT NULL
        ORDER BY n.next_attempt_at, n.id
        LIMIT ${BATCH_LIMIT}
        FOR UPDATE OF n SKIP LOCKED
      )
      UPDATE notification_outbox AS o
      SET next_attempt_at = now() + interval '2 minutes',
          attempt_count = o.attempt_count + 1
      FROM due
      WHERE o.id = due.id
      RETURNING o.id, o.user_id, o.kind, o.payload, o.attempt_count
    `;
  }

  private async deliver(row: ClaimedRow, email: string): Promise<boolean> {
    if (/[\r\n]/.test(email)) {
      await this.markDead(row.id, row.kind);
      return false;
    }

    let subject: string;
    let text: string;
    try {
      if (!isNotificationKind(row.kind)) {
        throw new Error('Unknown notification kind');
      }
      const rendered = renderNotification(
        row.kind,
        normalizePayload(row.payload),
        this.env.PASSWORD_RESET_URL_BASE ?? resolveCorsOrigin(this.env),
      );
      subject = rendered.subject.replace(/[\r\n]/g, '');
      text = rendered.text;
    } catch {
      await this.markDead(row.id, row.kind);
      return false;
    }

    try {
      assertSingleEmailRecipient(email);
      await withNotificationSendTimeout(
        this.mail.send({ to: email, subject, text }),
        NOTIFICATION_SEND_TIMEOUT_MS,
      );
    } catch (error) {
      await this.recordFailure(row, error);
      return false;
    }

    await this.markSent(row.id);
    return true;
  }

  private async recordFailure(row: ClaimedRow, error: unknown): Promise<void> {
    const decision = resolveDeliveryFailure(error, row.attempt_count);
    if (decision.outcome === 'dead') {
      await this.markDead(row.id, row.kind);
      return;
    }

    await this.prisma.$executeRaw`
      UPDATE notification_outbox
      SET next_attempt_at = now() + (${decision.delaySeconds} * interval '1 second')
      WHERE id = ${row.id}::uuid
        AND status = 'PENDING'::"NotificationOutboxStatus"
    `;
  }

  private async markSent(id: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE notification_outbox
      SET status = 'SENT'::"NotificationOutboxStatus",
          sent_at = now()
      WHERE id = ${id}::uuid
        AND status = 'PENDING'::"NotificationOutboxStatus"
    `;
  }

  private async markDead(id: string, kind: string): Promise<void> {
    const updated = await this.prisma.$executeRaw`
      UPDATE notification_outbox
      SET status = 'FAILED'::"NotificationOutboxStatus"
      WHERE id = ${id}::uuid
        AND status = 'PENDING'::"NotificationOutboxStatus"
    `;
    if (updated !== 1) return;
    this.logger.error(`Notification delivery dead id=${id} kind=${kind}`);
  }

  private async release(id: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE notification_outbox
      SET next_attempt_at = now()
      WHERE id = ${id}::uuid
        AND status = 'PENDING'::"NotificationOutboxStatus"
    `;
  }
}
