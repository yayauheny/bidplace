import { describe, expect, it } from 'vitest';
import type { PublicLot } from '@bidplace/contracts';

import {
  lotExtensionLabel,
  lotPollIntervalMs,
  lotSaleOpen,
  presentLot,
  syncedNowMs,
} from './lot-view';

const HOUR = 60 * 60 * 1000;

function lot(patch: Partial<PublicLot> = {}): PublicLot {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    type: 'AUCTION',
    effectiveStatus: 'LIVE',
    currency: 'BYN',
    priceMinor: 125000,
    minimumBidMinor: 126000,
    bidCount: 2,
    startsAt: '2026-11-01T09:00:00.000Z',
    endsAt: '2026-11-01T12:00:00.000Z',
    contactWindowHours: 24,
    mark: 'AUCTION',
    serverNow: '2026-11-01T10:00:00.000Z',
    viewer: { role: 'buyer', isLeading: false, blockedReason: null },
    ...patch,
  };
}

const now = Date.parse('2026-11-01T10:00:00.000Z');

function shown(value: string | null) {
  return value?.replace(/[\u00a0\u202f]/g, ' ') ?? null;
}

describe('presentLot', () => {
  it.each([
    {
      name: 'fixed live',
      patch: {
        type: 'FIXED' as const,
        mark: 'BUY' as const,
        priceMinor: 125000,
        minimumBidMinor: null,
        bidCount: 0,
        endsAt: null,
      },
      priceCaption: 'Цена',
      priceLabel: '1 250 BYN',
      action: 'buy',
      enabled: true,
      deal: true,
    },
    {
      name: 'auction scheduled',
      patch: {
        effectiveStatus: 'SCHEDULED' as const,
        mark: 'SCHEDULED' as const,
        priceMinor: null,
        minimumBidMinor: 50000,
        bidCount: 0,
        endsAt: '2026-11-08T09:00:00.000Z',
      },
      priceCaption: 'Начальная цена',
      priceLabel: '500 BYN',
      action: null,
      enabled: false,
      deal: true,
    },
    {
      name: 'auction live with bids',
      patch: {},
      priceCaption: 'Текущая цена',
      priceLabel: '1 250 BYN',
      action: 'bid',
      enabled: true,
      deal: true,
    },
    {
      name: 'leader',
      patch: {
        viewer: {
          role: 'buyer' as const,
          isLeading: true,
          blockedReason: 'BID_ALREADY_LEADING',
        },
      },
      priceCaption: 'Текущая цена',
      priceLabel: '1 250 BYN',
      action: 'bid',
      enabled: false,
      deal: true,
    },
  ])(
    '$name',
    ({ patch, priceCaption, priceLabel, action, enabled, deal }) => {
      const view = presentLot({
        lot: lot(patch),
        syncedNowMs: now,
        extended: false,
      });
      expect(view.priceCaption).toBe(priceCaption);
      expect(shown(view.priceLabel)).toBe(priceLabel);
      expect(view.action?.kind ?? null).toBe(action);
      expect(view.action?.enabled ?? false).toBe(enabled);
      expect(view.deal).toBe(deal);
      expect(view.priceLabel).not.toBe('0 BYN');
    },
  );

  it('shows the server minimum as the start price and does not invent zero', () => {
    const view = presentLot({
      lot: lot({
        priceMinor: null,
        minimumBidMinor: 50000,
        bidCount: 0,
        mark: 'AUCTION',
      }),
      syncedNowMs: now,
      extended: false,
    });
    expect(view.priceCaption).toBe('Начальная цена');
    expect(shown(view.priceLabel)).toBe('500 BYN');
    expect(view.bidLabel).toBe('ставок нет');
  });

  it('leaves the start price blank when the server sends neither price', () => {
    const view = presentLot({
      lot: lot({ priceMinor: null, minimumBidMinor: null, bidCount: 0 }),
      syncedNowMs: now,
      extended: false,
    });
    expect(view.priceLabel).toBeNull();
  });

  it.each([
    ['RESERVED', 'Забронировано'],
    ['SOLD', 'Продано'],
  ] as const)('mark %s hides buy and bid', (mark, label) => {
    const view = presentLot({
      lot: lot({
        mark,
        effectiveStatus: 'ENDED',
        viewer: {
          role: 'buyer',
          isLeading: false,
          blockedReason: null,
        },
      }),
      syncedNowMs: now,
      extended: false,
    });
    expect(view.phase).toBe(mark === 'SOLD' ? 'sold' : 'reserved');
    expect(view.statusLabel).toBe(label);
    expect(view.action).toBeNull();
    expect(view.deal).toBe(true);
  });

  it('treats cancelled and unmarked ended lots as portfolio', () => {
    for (const effectiveStatus of ['CANCELLED', 'ENDED'] as const) {
      const view = presentLot({
        lot: lot({ effectiveStatus, mark: null, endsAt: null }),
        syncedNowMs: now,
        extended: false,
      });
      expect(view.phase).toBe('portfolio');
      expect(view.deal).toBe(false);
      expect(view.action).toBeNull();
      expect(lotSaleOpen(view)).toBe(false);
    }
  });

  it('switches to the close copy when local time reaches endsAt', () => {
    const view = presentLot({
      lot: lot({ effectiveStatus: 'LIVE', mark: 'AUCTION' }),
      syncedNowMs: Date.parse('2026-11-01T12:00:00.000Z'),
      extended: false,
    });
    expect(view.phase).toBe('awaiting-close');
    expect(view.statusLabel).toBe('Аукцион завершён, подводим итоги');
    expect(view.action).toBeNull();
  });

  it('keeps a scheduled lot scheduled until the server leaves that status', () => {
    const view = presentLot({
      lot: lot({
        effectiveStatus: 'SCHEDULED',
        mark: 'SCHEDULED',
        priceMinor: null,
        minimumBidMinor: 50000,
        bidCount: 0,
        startsAt: '2026-11-01T09:00:00.000Z',
      }),
      syncedNowMs: Date.parse('2026-11-01T10:00:00.000Z'),
      extended: false,
    });
    expect(view.phase).toBe('auction-scheduled');
    expect(view.scheduleLabel).toBe('Аукцион начнётся 01.11 в 12:00');
    expect(view.action).toBeNull();
  });

  it('sends an anonymous buyer to sign in and does not enable an unknown block', () => {
    const anonymous = presentLot({
      lot: lot({ viewer: null }),
      syncedNowMs: now,
      extended: false,
    });
    expect(anonymous.action).toEqual({
      kind: 'sign-in',
      enabled: true,
      reason: null,
      owner: 'auth',
    });

    const unknown = presentLot({
      lot: lot({
        viewer: {
          role: 'buyer',
          isLeading: false,
          blockedReason: 'NOT_A_REAL_CODE',
        },
      }),
      syncedNowMs: now,
      extended: false,
    });
    expect(unknown.action?.enabled).toBe(false);
    expect(unknown.action?.reason).toBe('Действие сейчас недоступно.');
    expect(unknown.action?.reason).not.toContain('NOT_A_REAL_CODE');
  });

  it('uses the mapped block text and email verification without raw codes', () => {
    const blocked = presentLot({
      lot: lot({
        viewer: {
          role: 'buyer',
          isLeading: false,
          blockedReason: 'BUYER_BLOCKED',
        },
      }),
      syncedNowMs: now,
      extended: false,
    });
    expect(blocked.action?.enabled).toBe(false);
    expect(blocked.action?.reason).toBe(
      'Ставки и покупки для вашего аккаунта ограничены.',
    );

    const email = presentLot({
      lot: lot({
        viewer: {
          role: 'buyer',
          isLeading: false,
          blockedReason: 'EMAIL_VERIFICATION_REQUIRED',
        },
      }),
      syncedNowMs: now,
      extended: false,
    });
    expect(email.action).toMatchObject({
      kind: 'verify-email',
      enabled: true,
      owner: 'auth',
    });
  });

  it('describes author cancel from public fields and does not offer a bid', () => {
    const open = presentLot({
      lot: lot({
        bidCount: 0,
        priceMinor: null,
        minimumBidMinor: 50000,
        viewer: {
          role: 'seller',
          isLeading: false,
          blockedReason: 'SELF_BID_FORBIDDEN',
        },
      }),
      syncedNowMs: now,
      extended: false,
    });
    expect(open.action).toMatchObject({
      kind: 'cancel-lot',
      enabled: true,
      owner: 'task-5',
    });

    const locked = presentLot({
      lot: lot({
        bidCount: 2,
        viewer: {
          role: 'seller',
          isLeading: false,
          blockedReason: 'SELF_BID_FORBIDDEN',
        },
      }),
      syncedNowMs: now,
      extended: false,
    });
    expect(locked.action).toMatchObject({
      kind: 'cancel-lot',
      enabled: false,
      owner: 'task-5',
    });
    expect(locked.authorHint).toBe('Аукцион со ставками снять нельзя.');
  });
});

describe('lot clock and poll', () => {
  it('continues an old cache from serverNow instead of restarting the term', () => {
    const serverNow = Date.parse('2026-11-01T10:00:00.000Z');
    const fetchedAt = 1_000_000;
    const synced = syncedNowMs({
      serverNow: '2026-11-01T10:00:00.000Z',
      dataUpdatedAt: fetchedAt,
      deviceNow: fetchedAt + 50_000,
    });
    expect(synced - serverNow).toBe(50_000);
    const view = presentLot({
      lot: lot({ endsAt: '2026-11-01T10:01:00.000Z' }),
      syncedNowMs: synced,
      extended: false,
    });
    expect(view.timerLabel).toBe('00:10');
  });

  it('corrects a jumped device clock after a newer serverNow', () => {
    const jumped = syncedNowMs({
      serverNow: '2026-11-01T10:00:00.000Z',
      dataUpdatedAt: 5_000,
      deviceNow: 5_000 + HOUR,
    });
    expect(jumped).toBe(Date.parse('2026-11-01T10:00:00.000Z') + HOUR);
    const corrected = syncedNowMs({
      serverNow: '2026-11-01T11:00:00.000Z',
      dataUpdatedAt: 9_000,
      deviceNow: 9_000,
    });
    expect(corrected).toBe(Date.parse('2026-11-01T11:00:00.000Z'));
  });

  it.each([
    {
      name: 'quiet live',
      patch: { endsAt: '2026-11-01T12:00:00.000Z' },
      syncedNowMs: now,
      active: true,
      interval: 10_000,
    },
    {
      name: 'final two minutes',
      patch: { endsAt: '2026-11-01T10:01:30.000Z' },
      syncedNowMs: now,
      active: true,
      interval: 3_000,
    },
    {
      name: 'hidden',
      patch: {},
      syncedNowMs: now,
      active: false,
      interval: false,
    },
    {
      name: 'sold',
      patch: { mark: 'SOLD' as const, effectiveStatus: 'ENDED' as const },
      syncedNowMs: now,
      active: true,
      interval: false,
    },
  ])('$name polls at $interval', ({ patch, syncedNowMs: synced, active, interval }) => {
    expect(
      lotPollIntervalMs({
        active,
        lot: lot(patch),
        syncedNowMs: synced,
      }),
    ).toBe(interval);
  });

  it('checks a scheduled lot at the start and keeps checking if the server stays scheduled', () => {
    const scheduled = lot({
      effectiveStatus: 'SCHEDULED',
      mark: 'SCHEDULED',
      startsAt: '2026-11-01T10:00:30.000Z',
    });
    expect(
      lotPollIntervalMs({
        active: true,
        lot: scheduled,
        syncedNowMs: now,
      }),
    ).toBe(30_000);
    expect(
      lotPollIntervalMs({
        active: true,
        lot: scheduled,
        syncedNowMs: Date.parse('2026-11-01T10:00:30.000Z'),
      }),
    ).toBe(10_000);
  });

  it('keeps polling while the close is outstanding and stops after it resolves', () => {
    expect(
      lotPollIntervalMs({
        active: true,
        lot: lot({ effectiveStatus: 'AWAITING_CLOSE', mark: null }),
        syncedNowMs: Date.parse('2026-11-01T12:00:05.000Z'),
      }),
    ).toBe(3_000);
    expect(
      lotPollIntervalMs({
        active: true,
        lot: lot({ effectiveStatus: 'ENDED', mark: null }),
        syncedNowMs: Date.parse('2026-11-01T12:00:05.000Z'),
      }),
    ).toBe(false);
  });

  it('shows one extension hint for the same listing and none for the first response or a new id', () => {
    const first = lot();
    expect(lotExtensionLabel(null, first)).toBeNull();
    expect(
      lotExtensionLabel(
        { id: first.id, endsAt: first.endsAt },
        lot({ endsAt: '2026-11-01T12:01:00.000Z' }),
      ),
    ).toBe('Продлено на минуту: ставка в последние секунды');
    expect(
      lotExtensionLabel(
        { id: first.id, endsAt: first.endsAt },
        lot({
          id: '22222222-2222-4222-8222-222222222222',
          endsAt: '2026-11-01T13:00:00.000Z',
        }),
      ),
    ).toBeNull();
  });
});
