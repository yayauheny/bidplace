import { describe, expect, it } from 'vitest';

import {
  ORDER_CONTACT_WINDOW_HOURS,
  ORDER_CONTACT_WINDOW_MS,
  computeOrderContactDueAt,
  orderContactSchedule,
} from './order-contact-deadline';

describe('computeOrderContactDueAt', () => {
  it('uses a fixed 48-hour window', () => {
    expect(ORDER_CONTACT_WINDOW_HOURS).toBe(48);
    expect(ORDER_CONTACT_WINDOW_MS).toBe(48 * 60 * 60 * 1000);
  });

  it('adds exactly 48 hours in UTC milliseconds', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const due = computeOrderContactDueAt(now);

    expect(due.toISOString()).toBe('2026-01-03T00:00:00.000Z');
    expect(due.getTime() - now.getTime()).toBe(ORDER_CONTACT_WINDOW_MS);
  });

  it('stays timezone-independent around a DST boundary', () => {
    const now = new Date('2026-03-07T23:30:00.000Z');
    const due = computeOrderContactDueAt(now);

    expect(due.getTime() - now.getTime()).toBe(ORDER_CONTACT_WINDOW_MS);
    expect(due.toISOString()).toBe('2026-03-09T23:30:00.000Z');
  });

  it('pairs createdAt with an exact 48-hour contactDueAt', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const schedule = orderContactSchedule(now);

    expect(schedule.createdAt).toBe(now);
    expect(schedule.contactDueAt.toISOString()).toBe(
      '2026-01-03T00:00:00.000Z',
    );
    expect(
      schedule.contactDueAt.getTime() - schedule.createdAt.getTime(),
    ).toBe(ORDER_CONTACT_WINDOW_MS);
  });
});
