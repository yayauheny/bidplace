import { createHash } from 'node:crypto';

import { ApiErrorCode } from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';

import { classifyMailFailure } from '../antifraud';
import { AppException } from '../core/errors';
import {
  isNotificationKind,
  NOTIFICATION_KINDS,
  type NotificationKind,
} from './notification-kinds';
import { renderNotification } from './notification-templates';

export {
  NOTIFICATION_KINDS,
  renderNotification,
  type NotificationKind,
};

export const NOTIFICATION_ATTEMPT_LIMIT = 10;
export const NOTIFICATION_SEND_TIMEOUT_MS = 10_000;
const BACKOFF_SECONDS = [60, 120, 300, 600, 1800, 3600, 7200, 14400, 28800];

export type NotificationPayload = Record<string, string | number>;

const ORDER_FIELDS = [
  'workTitle',
  'comment',
  'buyerName',
  'sellerName',
  'dealCode',
  'amountMinor',
  'currency',
  'completedAt',
  'failReason',
  'listingType',
  'listingId',
] as const;

const PAYLOAD_CONTRACT: Record<
  NotificationKind,
  { required: readonly string[]; allowed: ReadonlySet<string> }
> = {
  BID_WON: contract(['orderPublicId'], ORDER_FIELDS),
  PURCHASED: contract(['orderPublicId'], ORDER_FIELDS),
  LISTING_SOLD: contract(['orderPublicId'], ORDER_FIELDS),
  OFFER_RECEIVED: contract(['orderPublicId'], ORDER_FIELDS),
  DEAL_COMPLETED: contract(['orderPublicId'], ORDER_FIELDS),
  ORDER_FAILED: contract(['orderPublicId'], ORDER_FIELDS),
  CONFIRM_DEAL_REMINDER: contract(['orderPublicId', 'slot'], ORDER_FIELDS),
  ORDER_REPORTED: contract(
    ['orderPublicId', 'reportId'],
    ['workTitle', 'listingId'],
  ),
  AUCTION_ENDED_NO_BIDS: contract(
    ['listingId'],
    ['workTitle', 'orderPublicId'],
  ),
  LISTING_REMOVED: contract(['listingId'], ['workTitle', 'orderPublicId']),
  OUTBID: contract(['bidId'], ['workTitle', 'listingId', 'orderPublicId']),
  CONTACTS_CHANGED: contract(['eventId'], []),
};

function contract(
  required: readonly string[],
  optional: readonly string[],
): { required: readonly string[]; allowed: ReadonlySet<string> } {
  return {
    required,
    allowed: new Set([...required, ...optional]),
  };
}

function notificationBackoffSeconds(attempt: number): number {
  const index = Math.min(Math.max(attempt, 1), BACKOFF_SECONDS.length) - 1;
  return BACKOFF_SECONDS[index] ?? 60;
}

/**
 * `attemptCount` is the try already stored on the row (claim increments it
 * before send). Attempt 1 waits 60s; attempt 10 is dead.
 */
export function resolveDeliveryFailure(
  error: unknown,
  attemptCount: number,
): { outcome: 'retry'; delaySeconds: number } | { outcome: 'dead' } {
  if (
    attemptCount >= NOTIFICATION_ATTEMPT_LIMIT ||
    classifyMailFailure(error) === 'rejected'
  ) {
    return { outcome: 'dead' };
  }
  return {
    outcome: 'retry',
    delaySeconds: notificationBackoffSeconds(attemptCount),
  };
}

export function withNotificationSendTimeout<T>(
  work: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('notification send timed out'));
    }, timeoutMs);
  });
  return Promise.race([work, timeout]).finally(() => {
    clearTimeout(timer);
  });
}

function invalidPayload(): never {
  throw new AppException({
    status: 400,
    code: ApiErrorCode.VALIDATION_ERROR,
    message: 'Notification payload is invalid',
  });
}

export function assertNotificationPayload(
  kind: NotificationKind,
  payload: NotificationPayload,
): void {
  const spec = PAYLOAD_CONTRACT[kind];
  for (const key of spec.required) {
    if (!(key in payload)) invalidPayload();
  }
  for (const [key, value] of Object.entries(payload)) {
    if (!spec.allowed.has(key)) invalidPayload();
    if (key === 'amountMinor') {
      if (typeof value !== 'number' || !Number.isInteger(value)) invalidPayload();
      continue;
    }
    if (typeof value !== 'string' || value.length === 0) invalidPayload();
    if (key === 'orderPublicId' && !/^[A-Za-z0-9_-]{1,16}$/.test(value)) {
      invalidPayload();
    }
    if (key === 'slot' && value !== '24h' && value !== '48h') invalidPayload();
  }
}

function notificationDedupeId(
  userId: string,
  kind: NotificationKind,
  payload: NotificationPayload,
): string {
  const canonical = JSON.stringify(
    Object.keys(payload)
      .sort()
      .map((key) => [key, payload[key]]),
  );
  const hash = createHash('sha256')
    .update(`${userId}\0${kind}\0${canonical}`)
    .digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Inserts one outbox row in the caller transaction and does not send mail.
 * The row id is a hash of user, kind, and canonical payload. A repeat is
 * `INSERT ... ON CONFLICT (id) DO NOTHING` and does not abort the caller
 * transaction. Recurring kinds require a discriminator: `slot` (`24h`|`48h`)
 * on `CONFIRM_DEAL_REMINDER`, `bidId` on `OUTBID`, `reportId` on
 * `ORDER_REPORTED`, `eventId` on `CONTACTS_CHANGED`. Other keys are rejected.
 */
export async function enqueueNotification(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    kind: NotificationKind;
    payload: NotificationPayload;
  },
): Promise<void> {
  if (!isNotificationKind(input.kind)) {
    throw new AppException({
      status: 400,
      code: ApiErrorCode.VALIDATION_ERROR,
      message: 'Unknown notification kind',
    });
  }
  assertNotificationPayload(input.kind, input.payload);

  if (input.kind === 'OUTBID') {
    const settings = await tx.userNotificationSettings.findUnique({
      where: { userId: input.userId },
      select: { outbidEmail: true },
    });
    if (settings?.outbidEmail === false) return;
  }

  const id = notificationDedupeId(input.userId, input.kind, input.payload);
  const payloadJson = JSON.stringify(
    Object.fromEntries(
      Object.keys(input.payload)
        .sort()
        .map((key) => [key, input.payload[key]]),
    ),
  );

  await tx.$executeRaw`
    INSERT INTO notification_outbox (
      id, user_id, kind, payload, status, attempt_count, next_attempt_at
    )
    VALUES (
      ${id}::uuid,
      ${input.userId}::uuid,
      ${input.kind},
      ${payloadJson}::jsonb,
      'PENDING'::"NotificationOutboxStatus",
      0,
      now()
    )
    ON CONFLICT (id) DO NOTHING
  `;
}
