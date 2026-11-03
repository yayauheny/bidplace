import { createListingRequestSchema } from '@bidplace/contracts';
import { describe, expect, it } from 'vitest';

import {
  cabinetListOffer,
  createLotRequest,
  initialCreateLotDraft,
  sellerCommerceAccess,
} from './create-lot-form';

const NOW = Date.parse('2026-11-02T12:00:00.000Z');

describe('createLotRequest', () => {
  it('defaults the contact window to 24 hours and keeps the price visible', () => {
    const draft = initialCreateLotDraft();
    expect(draft.contactWindowHours).toBe(24);
    const fixed = { ...draft, amountText: '12,50' };
    const parsed = createLotRequest(fixed, NOW);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value).toMatchObject({
      type: 'FIXED',
      currency: 'BYN',
      priceMinor: 1250,
      contactWindowHours: 24,
      startsAt: '2000-01-01T00:00:00.000Z',
    });
    expect(parsed.value.startsAt).not.toBe(new Date(NOW - 5_000).toISOString());
    expect(createListingRequestSchema.safeParse(parsed.value).success).toBe(true);
    expect(parsed.endsLabel).toBeNull();
  });

  it('switches an auction to a start price and an explicit end', () => {
    const draft = {
      ...initialCreateLotDraft(),
      type: 'AUCTION' as const,
      currency: 'RUB' as const,
      amountText: '500',
      contactWindowHours: 6 as const,
      durationDays: 3 as const,
    };
    const parsed = createLotRequest(draft, NOW);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || parsed.value.type !== 'AUCTION') return;
    expect(parsed.value.startPriceMinor).toBe(50_000);
    expect(parsed.value.currency).toBe('RUB');
    expect(parsed.value.contactWindowHours).toBe(6);
    expect(parsed.value.startsAt).toBe('2000-01-01T00:00:00.000Z');
    expect(Date.parse(parsed.value.endsAt) - Date.parse(parsed.value.startsAt)).toBe(
      3 * 24 * 60 * 60 * 1000,
    );
    expect(parsed.value.startsAt).not.toBe(new Date(NOW).toISOString());
    expect(parsed.endsLabel).toMatch(/05\.11\.2026 15:00/);
    expect(createListingRequestSchema.safeParse(parsed.value).success).toBe(true);
  });

  it('keeps a chosen future start and does not replace it with the immediate anchor', () => {
    const parsed = createLotRequest(
      {
        ...initialCreateLotDraft(),
        type: 'AUCTION',
        amountText: '25',
        durationDays: 1,
        startMode: 'scheduled',
        startDate: '01.12.2026',
        startTime: '15:00',
      },
      NOW,
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || parsed.value.type !== 'AUCTION') return;
    expect(parsed.value.startsAt).toBe('2026-12-01T12:00:00.000Z');
    expect(Date.parse(parsed.value.endsAt) - Date.parse(parsed.value.startsAt)).toBe(
      24 * 60 * 60 * 1000,
    );
    expect(parsed.endsLabel).toMatch(/02\.12\.2026 15:00/);
  });

  it('rejects an auction price that is not a bid step', () => {
    const parsed = createLotRequest(
      {
        ...initialCreateLotDraft(),
        type: 'AUCTION',
        amountText: '10,01',
        durationDays: 1,
      },
      NOW,
    );
    expect(parsed).toEqual({
      ok: false,
      message: 'Стартовая цена должна быть кратна шагу ставки.',
    });
  });

  it('accepts a custom duration inside 1 to 14 days', () => {
    const parsed = createLotRequest(
      {
        ...initialCreateLotDraft(),
        type: 'AUCTION',
        amountText: '25',
        durationDays: null,
        customDaysText: '14',
      },
      NOW,
    );
    expect(parsed.ok).toBe(true);
  });
});

describe('sellerCommerceAccess', () => {
  it('lets a suspended author see sales without starting a new one', () => {
    expect(sellerCommerceAccess('APPROVED')).toEqual({
      viewSales: true,
      startSale: true,
    });
    expect(sellerCommerceAccess('SUSPENDED')).toEqual({
      viewSales: true,
      startSale: false,
    });
    expect(sellerCommerceAccess(null)).toEqual({
      viewSales: false,
      startSale: false,
    });
  });
});

describe('cabinetListOffer', () => {
  it('enables only a published work and explains the server status', () => {
    expect(cabinetListOffer({ status: 'APPROVED', isSuspended: false }).enabled).toBe(
      true,
    );
    expect(cabinetListOffer({ status: 'ARCHIVED', isSuspended: false }).reason).toMatch(
      /Скрытую/,
    );
    expect(
      cabinetListOffer({ status: 'PENDING_REVIEW', isSuspended: false }).enabled,
    ).toBe(false);
    expect(cabinetListOffer({ status: 'APPROVED', isSuspended: true }).enabled).toBe(
      false,
    );
  });
});
