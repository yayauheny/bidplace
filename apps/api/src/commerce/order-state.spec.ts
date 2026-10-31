import {
  ApiErrorCode,
  ORDER_FAIL_REASONS,
  type OrderStatus,
} from '@bidplace/contracts';
import { describe, expect, it } from 'vitest';

import { AppException } from '../core/errors/app.exception';
import {
  assertOrderTransition,
  faultOf,
  type OrderActor,
  type OrderFailReason,
} from './order-state';

const now = new Date('2026-10-30T12:00:00.000Z');
const justAfterNow = new Date(now.getTime() + 1);
const justBeforeNow = new Date(now.getTime() - 1);
const actors = ['buyer', 'seller', 'system', 'admin'] as const;

type OrderView = {
  status: OrderStatus;
  offerExpiresAt: Date | null;
  contactDeadlineAt: Date | null;
};

type Next = { to: OrderStatus; failReason?: OrderFailReason };

type Row = {
  label: string;
  order: OrderView;
  next: Next;
  allow: readonly OrderActor[];
};

const offered = (offerExpiresAt: Date | null): OrderView => ({
  status: 'OFFERED',
  offerExpiresAt,
  contactDeadlineAt: null,
});

const active = (contactDeadlineAt: Date | null): OrderView => ({
  status: 'ACTIVE',
  offerExpiresAt: null,
  contactDeadlineAt,
});

const completed: OrderView = {
  status: 'COMPLETED',
  offerExpiresAt: null,
  contactDeadlineAt: null,
};

const failed: OrderView = {
  status: 'FAILED',
  offerExpiresAt: null,
  contactDeadlineAt: null,
};

const rows: Row[] = [
  {
    label: 'buyer accepts an open offer',
    order: offered(justAfterNow),
    next: { to: 'ACTIVE' },
    allow: ['buyer'],
  },
  {
    label: 'buyer accepts at offerExpiresAt',
    order: offered(now),
    next: { to: 'ACTIVE' },
    allow: [],
  },
  {
    label: 'buyer accepts after offerExpiresAt',
    order: offered(justBeforeNow),
    next: { to: 'ACTIVE' },
    allow: [],
  },
  {
    label: 'buyer accepts an offer without an expiry',
    order: offered(null),
    next: { to: 'ACTIVE' },
    allow: [],
  },
  {
    label: 'buyer accepts with a fail reason',
    order: offered(justAfterNow),
    next: { to: 'ACTIVE', failReason: 'OFFER_DECLINED' },
    allow: [],
  },
  {
    label: 'buyer declines an open offer',
    order: offered(justAfterNow),
    next: { to: 'FAILED', failReason: 'OFFER_DECLINED' },
    allow: ['buyer'],
  },
  {
    label: 'buyer declines at offerExpiresAt',
    order: offered(now),
    next: { to: 'FAILED', failReason: 'OFFER_DECLINED' },
    allow: ['buyer'],
  },
  {
    label: 'buyer declines after offerExpiresAt',
    order: offered(justBeforeNow),
    next: { to: 'FAILED', failReason: 'OFFER_DECLINED' },
    allow: ['buyer'],
  },
  {
    label: 'buyer declines an offer without an expiry',
    order: offered(null),
    next: { to: 'FAILED', failReason: 'OFFER_DECLINED' },
    allow: ['buyer'],
  },
  {
    label: 'system expires an offer before offerExpiresAt',
    order: offered(justAfterNow),
    next: { to: 'FAILED', failReason: 'OFFER_EXPIRED' },
    allow: [],
  },
  {
    label: 'system expires an offer at offerExpiresAt',
    order: offered(now),
    next: { to: 'FAILED', failReason: 'OFFER_EXPIRED' },
    allow: ['system'],
  },
  {
    label: 'system expires an offer after offerExpiresAt',
    order: offered(justBeforeNow),
    next: { to: 'FAILED', failReason: 'OFFER_EXPIRED' },
    allow: ['system'],
  },
  {
    label: 'system expires an offer without an expiry',
    order: offered(null),
    next: { to: 'FAILED', failReason: 'OFFER_EXPIRED' },
    allow: [],
  },
  {
    label: 'offered order fails without a reason',
    order: offered(justAfterNow),
    next: { to: 'FAILED' },
    allow: [],
  },
  {
    label: 'offered order completes',
    order: offered(justAfterNow),
    next: { to: 'COMPLETED' },
    allow: [],
  },
  ...ORDER_FAIL_REASONS.filter(
    (reason) => reason !== 'OFFER_DECLINED' && reason !== 'OFFER_EXPIRED',
  ).map((reason) => ({
    label: `offered order fails as ${reason}`,
    order: offered(justBeforeNow),
    next: { to: 'FAILED' as const, failReason: reason },
    allow: [] as const,
  })),
  {
    label: 'seller or admin completes an active order',
    order: active(justAfterNow),
    next: { to: 'COMPLETED' },
    allow: ['seller', 'admin'],
  },
  {
    label: 'active order completes with a fail reason',
    order: active(justAfterNow),
    next: { to: 'COMPLETED', failReason: 'SELLER_REFUSED' },
    allow: [],
  },
  {
    label: 'buyer or seller refuses an active order',
    order: active(justAfterNow),
    next: { to: 'FAILED', failReason: 'BUYER_REFUSED' },
    allow: ['buyer', 'seller', 'admin'],
  },
  {
    label: 'seller marks no contact before contactDeadlineAt',
    order: active(justAfterNow),
    next: { to: 'FAILED', failReason: 'BUYER_NO_CONTACT' },
    allow: ['admin'],
  },
  {
    label: 'seller marks no contact at contactDeadlineAt',
    order: active(now),
    next: { to: 'FAILED', failReason: 'BUYER_NO_CONTACT' },
    allow: ['seller', 'admin'],
  },
  {
    label: 'seller marks no contact after contactDeadlineAt',
    order: active(justBeforeNow),
    next: { to: 'FAILED', failReason: 'BUYER_NO_CONTACT' },
    allow: ['seller', 'admin'],
  },
  {
    label: 'seller marks no contact without contactDeadlineAt',
    order: active(null),
    next: { to: 'FAILED', failReason: 'BUYER_NO_CONTACT' },
    allow: ['admin'],
  },
  {
    label: 'seller marks invalid contacts before contactDeadlineAt',
    order: active(justAfterNow),
    next: { to: 'FAILED', failReason: 'BUYER_INVALID_CONTACTS' },
    allow: ['admin'],
  },
  {
    label: 'seller marks invalid contacts at contactDeadlineAt',
    order: active(now),
    next: { to: 'FAILED', failReason: 'BUYER_INVALID_CONTACTS' },
    allow: ['seller', 'admin'],
  },
  {
    label: 'seller marks invalid contacts after contactDeadlineAt',
    order: active(justBeforeNow),
    next: { to: 'FAILED', failReason: 'BUYER_INVALID_CONTACTS' },
    allow: ['seller', 'admin'],
  },
  {
    label: 'seller marks invalid contacts without contactDeadlineAt',
    order: active(null),
    next: { to: 'FAILED', failReason: 'BUYER_INVALID_CONTACTS' },
    allow: ['admin'],
  },
  {
    label: 'seller refuses an active order',
    order: active(null),
    next: { to: 'FAILED', failReason: 'SELLER_REFUSED' },
    allow: ['seller', 'admin'],
  },
  {
    label: 'active order fails as OFFER_DECLINED',
    order: active(null),
    next: { to: 'FAILED', failReason: 'OFFER_DECLINED' },
    allow: ['admin'],
  },
  {
    label: 'active order fails as OFFER_EXPIRED',
    order: active(null),
    next: { to: 'FAILED', failReason: 'OFFER_EXPIRED' },
    allow: ['admin'],
  },
  {
    label: 'active order fails as ADMIN_CANCELLED',
    order: active(null),
    next: { to: 'FAILED', failReason: 'ADMIN_CANCELLED' },
    allow: ['admin'],
  },
  {
    label: 'active order fails without a reason',
    order: active(justBeforeNow),
    next: { to: 'FAILED' },
    allow: [],
  },
  {
    label: 'active order returns to OFFERED',
    order: active(null),
    next: { to: 'OFFERED' },
    allow: [],
  },
  {
    label: 'active order stays ACTIVE',
    order: active(null),
    next: { to: 'ACTIVE' },
    allow: [],
  },
  ...ORDER_FAIL_REASONS.map((reason) => ({
    label: `admin moves a completed order to FAILED (${reason})`,
    order: completed,
    next: { to: 'FAILED' as const, failReason: reason },
    allow: ['admin'] as const,
  })),
  {
    label: 'admin moves a completed order to FAILED without a reason',
    order: completed,
    next: { to: 'FAILED' },
    allow: [],
  },
  {
    label: 'completed order stays COMPLETED',
    order: completed,
    next: { to: 'COMPLETED' },
    allow: [],
  },
  {
    label: 'completed order reopens',
    order: completed,
    next: { to: 'ACTIVE' },
    allow: [],
  },
  {
    label: 'admin restores a failed order to COMPLETED',
    order: failed,
    next: { to: 'COMPLETED' },
    allow: ['admin'],
  },
  {
    label: 'admin restores a failed order with a fail reason still set',
    order: failed,
    next: { to: 'COMPLETED', failReason: 'ADMIN_CANCELLED' },
    allow: [],
  },
  ...ORDER_FAIL_REASONS.map((reason) => ({
    label: `admin changes a failed order reason to ${reason}`,
    order: failed,
    next: { to: 'FAILED' as const, failReason: reason },
    allow: ['admin'] as const,
  })),
  {
    label: 'failed order stays FAILED without a reason',
    order: failed,
    next: { to: 'FAILED' },
    allow: [],
  },
  {
    label: 'failed order reopens',
    order: failed,
    next: { to: 'ACTIVE' },
    allow: [],
  },
];

const cases = rows.flatMap((row) =>
  actors.map((actor) => ({
    label: row.label,
    order: row.order,
    next: row.next,
    actor,
    allowed: row.allow.includes(actor),
  })),
);

describe('order transitions', () => {
  it.each(cases)('$label for $actor', (row) => {
    const run = () =>
      assertOrderTransition(row.order, row.actor, row.next, now);

    if (row.allowed) {
      expect(run).not.toThrow();
      return;
    }

    let caught: unknown;
    try {
      run();
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(AppException);
    if (!(caught instanceof AppException)) return;
    expect(caught.apiCode).toBe(ApiErrorCode.ORDER_TRANSITION_NOT_ALLOWED);
    expect(caught.getStatus()).toBe(409);
    expect(caught.getResponse()).toEqual({
      code: ApiErrorCode.ORDER_TRANSITION_NOT_ALLOWED,
      message: 'Order transition is not allowed',
    });
  });
});

describe('fault side', () => {
  it.each([
    ['BUYER_REFUSED', 'BUYER'],
    ['BUYER_NO_CONTACT', 'BUYER'],
    ['BUYER_INVALID_CONTACTS', 'BUYER'],
    ['SELLER_REFUSED', 'SELLER'],
    ['OFFER_DECLINED', 'NONE'],
    ['OFFER_EXPIRED', 'NONE'],
    ['ADMIN_CANCELLED', 'NONE'],
  ] as const)('%s is %s', (reason, side) => {
    expect(faultOf(reason)).toBe(side);
  });
});
