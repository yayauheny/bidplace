import {
  ApiErrorCode,
  FAULT_SIDES,
  ORDER_FAIL_REASONS,
  type OrderStatus,
} from '@bidplace/contracts';

import { AppException } from '../core/errors/app.exception';

export type OrderActor = 'buyer' | 'seller' | 'system' | 'admin';
export type OrderFailReason = (typeof ORDER_FAIL_REASONS)[number];
export type FaultSide = (typeof FAULT_SIDES)[number];
export type OrderTransition = {
  to: OrderStatus;
  failReason?: OrderFailReason;
};

function refusal(): AppException {
  return new AppException({
    status: 409,
    code: ApiErrorCode.ORDER_TRANSITION_NOT_ALLOWED,
    message: 'Order transition is not allowed',
  });
}

function reasonFits(next: OrderTransition): boolean {
  return next.to === 'FAILED'
    ? next.failReason !== undefined
    : next.failReason === undefined;
}

function beforeInstant(now: Date, deadline: Date | null): boolean {
  return deadline !== null && now.getTime() < deadline.getTime();
}

function atOrAfterInstant(now: Date, deadline: Date | null): boolean {
  return deadline !== null && deadline.getTime() <= now.getTime();
}

function transitionAllowed(
  order: {
    status: OrderStatus;
    offerExpiresAt: Date | null;
    contactDeadlineAt: Date | null;
  },
  actor: OrderActor,
  next: OrderTransition,
  now: Date,
): boolean {
  if (!reasonFits(next)) return false;

  if (actor === 'admin') {
    if (order.status === 'ACTIVE') {
      return next.to === 'COMPLETED' || next.to === 'FAILED';
    }
    if (order.status === 'COMPLETED') return next.to === 'FAILED';
    if (order.status === 'FAILED') {
      return next.to === 'COMPLETED' || next.to === 'FAILED';
    }
    return false;
  }

  if (order.status === 'OFFERED' && actor === 'buyer' && next.to === 'ACTIVE') {
    return beforeInstant(now, order.offerExpiresAt);
  }
  if (
    order.status === 'OFFERED' &&
    actor === 'buyer' &&
    next.failReason === 'OFFER_DECLINED'
  ) {
    return true;
  }
  if (
    order.status === 'OFFERED' &&
    actor === 'system' &&
    next.failReason === 'OFFER_EXPIRED'
  ) {
    return atOrAfterInstant(now, order.offerExpiresAt);
  }
  if (
    order.status === 'ACTIVE' &&
    actor === 'seller' &&
    next.to === 'COMPLETED'
  ) {
    return true;
  }
  if (
    order.status === 'ACTIVE' &&
    next.failReason === 'BUYER_REFUSED' &&
    (actor === 'buyer' || actor === 'seller')
  ) {
    return true;
  }
  if (
    order.status === 'ACTIVE' &&
    actor === 'seller' &&
    next.failReason === 'SELLER_REFUSED'
  ) {
    return true;
  }
  if (
    order.status === 'ACTIVE' &&
    actor === 'seller' &&
    (next.failReason === 'BUYER_NO_CONTACT' ||
      next.failReason === 'BUYER_INVALID_CONTACTS')
  ) {
    return atOrAfterInstant(now, order.contactDeadlineAt);
  }
  return false;
}

export function assertOrderTransition(
  order: {
    status: OrderStatus;
    offerExpiresAt: Date | null;
    contactDeadlineAt: Date | null;
  },
  actor: OrderActor,
  next: OrderTransition,
  now: Date,
): void {
  if (!transitionAllowed(order, actor, next, now)) throw refusal();
}

export function faultOf(reason: OrderFailReason): FaultSide {
  switch (reason) {
    case 'BUYER_REFUSED':
    case 'BUYER_NO_CONTACT':
    case 'BUYER_INVALID_CONTACTS':
      return 'BUYER';
    case 'SELLER_REFUSED':
      return 'SELLER';
    case 'OFFER_DECLINED':
    case 'OFFER_EXPIRED':
    case 'ADMIN_CANCELLED':
      return 'NONE';
    default: {
      const unknown: never = reason;
      throw new Error(`unknown fail reason ${unknown}`);
    }
  }
}
