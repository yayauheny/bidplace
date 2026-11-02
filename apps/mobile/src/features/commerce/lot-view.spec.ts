import { describe, expect, it } from 'vitest';
import type { PublicLot } from '@bidplace/contracts';

import {
  LOT_EXTENSION_HINT_MS,
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
    });
    expect(view.priceCaption).toBe('Начальная цена');
    expect(shown(view.priceLabel)).toBe('500 BYN');
    expect(view.bidLabel).toBe('ставок нет');
  });

  it('leaves the start price blank when the server sends neither price', () => {
    const view = presentLot({
      lot: lot({ priceMinor: null, minimumBidMinor: null, bidCount: 0 }),
      syncedNowMs: now,
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
    });
    expect(view.phase).toBe('auction-scheduled');
    expect(view.scheduleLabel).toBe('Аукцион начнётся 01.11 в 12:00');
    expect(view.action).toBeNull();
  });

  it('sends an anonymous buyer to sign in and does not enable an unknown block', () => {
    const anonymous = presentLot({
      lot: lot({ viewer: null }),
      syncedNowMs: now,
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
    });
    expect(email.action).toMatchObject({
      kind: 'verify-email',
      enabled: true,
      owner: 'auth',
    });
  });

  it.each([
    {
      name: 'scheduled with no bids',
      patch: {
        effectiveStatus: 'SCHEDULED' as const,
        mark: 'SCHEDULED' as const,
        bidCount: 0,
        priceMinor: null,
        minimumBidMinor: 50000,
        endsAt: null,
      },
      syncedNowMs: now,
      blockedReason: 'LISTING_NOT_OPEN',
      enabled: true,
      hint: null,
    },
    {
      name: 'live with no bids',
      patch: { bidCount: 0, priceMinor: null, minimumBidMinor: 50000 },
      syncedNowMs: now,
      blockedReason: 'SELF_BID_FORBIDDEN',
      enabled: true,
      hint: null,
    },
    {
      name: 'awaiting close with no bids',
      patch: {
        effectiveStatus: 'AWAITING_CLOSE' as const,
        mark: null,
        bidCount: 0,
        priceMinor: null,
        minimumBidMinor: 50000,
        endsAt: '2026-11-01T10:00:00.000Z',
      },
      syncedNowMs: now,
      blockedReason: 'LISTING_NOT_OPEN',
      enabled: true,
      hint: null,
    },
    {
      name: 'scheduled with bids',
      patch: {
        effectiveStatus: 'SCHEDULED' as const,
        mark: 'SCHEDULED' as const,
        bidCount: 2,
        endsAt: null,
      },
      syncedNowMs: now,
      blockedReason: 'LISTING_NOT_OPEN',
      enabled: false,
      hint: 'Аукцион со ставками снять нельзя.',
    },
    {
      name: 'awaiting close with bids',
      patch: {
        effectiveStatus: 'AWAITING_CLOSE' as const,
        mark: null,
        bidCount: 2,
        endsAt: '2026-11-01T10:00:00.000Z',
      },
      syncedNowMs: now,
      blockedReason: 'LISTING_NOT_OPEN',
      enabled: false,
      hint: 'Аукцион со ставками снять нельзя.',
    },
  ])(
    'keeps the author cancel model for $name',
    ({ patch, syncedNowMs: synced, blockedReason, enabled, hint }) => {
      const view = presentLot({
        lot: lot({
          ...patch,
          viewer: { role: 'seller', isLeading: false, blockedReason },
        }),
        syncedNowMs: synced,
      });
      expect(view.phase === 'sold').toBe(false);
      expect(view.action).toMatchObject({
        kind: 'cancel-lot',
        enabled,
        owner: 'task-5',
      });
      expect(view.action?.kind === 'buy' || view.action?.kind === 'bid').toBe(false);
      expect(view.authorHint).toBe(hint);
    },
  );

  it.each([
    {
      name: 'buyer scheduled',
      patch: { effectiveStatus: 'SCHEDULED' as const, mark: 'SCHEDULED' as const, endsAt: null },
      viewer: { role: 'buyer' as const, isLeading: false, blockedReason: 'LISTING_NOT_OPEN' },
    },
    {
      name: 'anonymous scheduled',
      patch: { effectiveStatus: 'SCHEDULED' as const, mark: 'SCHEDULED' as const, endsAt: null },
      viewer: null,
    },
    {
      name: 'admin scheduled',
      patch: { effectiveStatus: 'SCHEDULED' as const, mark: 'SCHEDULED' as const, endsAt: null },
      viewer: { role: 'admin' as const, isLeading: false, blockedReason: 'LISTING_NOT_OPEN' },
    },
    {
      name: 'anonymous awaiting close',
      patch: {
        effectiveStatus: 'AWAITING_CLOSE' as const,
        mark: null,
        endsAt: '2026-11-01T10:00:00.000Z',
      },
      viewer: null,
    },
    {
      name: 'admin awaiting close',
      patch: {
        effectiveStatus: 'AWAITING_CLOSE' as const,
        mark: null,
        endsAt: '2026-11-01T10:00:00.000Z',
      },
      viewer: { role: 'admin' as const, isLeading: false, blockedReason: 'LISTING_NOT_OPEN' },
    },
    {
      name: 'buyer awaiting close',
      patch: {
        effectiveStatus: 'AWAITING_CLOSE' as const,
        mark: null,
        endsAt: '2026-11-01T10:00:00.000Z',
      },
      viewer: { role: 'buyer' as const, isLeading: false, blockedReason: 'LISTING_NOT_OPEN' },
    },
    {
      name: 'admin live',
      patch: {},
      viewer: { role: 'admin' as const, isLeading: false, blockedReason: 'ADMIN_BID_FORBIDDEN' },
    },
    {
      name: 'reserved seller',
      patch: { mark: 'RESERVED' as const },
      viewer: { role: 'seller' as const, isLeading: false, blockedReason: 'LISTING_NOT_OPEN' },
    },
    {
      name: 'sold seller',
      patch: { mark: 'SOLD' as const, effectiveStatus: 'ENDED' as const },
      viewer: { role: 'seller' as const, isLeading: false, blockedReason: 'LISTING_NOT_OPEN' },
    },
    {
      name: 'cancelled seller',
      patch: { effectiveStatus: 'CANCELLED' as const, mark: null },
      viewer: { role: 'seller' as const, isLeading: false, blockedReason: 'LISTING_NOT_OPEN' },
    },
    {
      name: 'ended without a mark',
      patch: { effectiveStatus: 'ENDED' as const, mark: null },
      viewer: { role: 'seller' as const, isLeading: false, blockedReason: 'LISTING_NOT_OPEN' },
    },
  ])('does not give $name an author cancel or a buyer action', ({ name, patch, viewer }) => {
    const view = presentLot({
      lot: lot({ ...patch, viewer }),
      syncedNowMs: now,
    });
    if (name === 'admin live') {
      expect(view.action).toMatchObject({ kind: 'bid', enabled: false, owner: 'task-4' });
      return;
    }
    expect(view.action).toBeNull();
  });

  it('keeps a fixed live author cancel from the public seller view', () => {
    const view = presentLot({
      lot: lot({
        type: 'FIXED',
        mark: 'BUY',
        bidCount: 0,
        minimumBidMinor: null,
        endsAt: null,
        viewer: { role: 'seller', isLeading: false, blockedReason: 'SELF_BID_FORBIDDEN' },
      }),
      syncedNowMs: now,
    });
    expect(view.phase).toBe('fixed-live');
    expect(view.action).toMatchObject({ kind: 'cancel-lot', enabled: true, owner: 'task-5' });
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
    {
      name: 'reserved',
      patch: { mark: 'RESERVED' as const, effectiveStatus: 'LIVE' as const },
      syncedNowMs: now,
      active: true,
      interval: false,
    },
    {
      name: 'cancelled',
      patch: { effectiveStatus: 'CANCELLED' as const, mark: null },
      syncedNowMs: now,
      active: true,
      interval: false,
    },
    {
      name: 'ended without a mark',
      patch: { effectiveStatus: 'ENDED' as const, mark: null },
      syncedNowMs: now,
      active: true,
      interval: false,
    },
    {
      name: 'inactive scheduled',
      patch: {
        effectiveStatus: 'SCHEDULED' as const,
        mark: 'SCHEDULED' as const,
        startsAt: '2026-12-01T10:00:00.000Z',
      },
      syncedNowMs: now,
      active: false,
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

  it('caps a 30-day scheduled start so the timer does not fire immediately, then waits out the remainder', async () => {
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const timerLimit = 2_147_483_647;
    const start = now + thirtyDays;
    const scheduled = lot({
      effectiveStatus: 'SCHEDULED',
      mark: 'SCHEDULED',
      startsAt: new Date(start).toISOString(),
    });
    const first = lotPollIntervalMs({
      active: true,
      lot: scheduled,
      syncedNowMs: now,
    });
    expect(typeof first).toBe('number');
    expect(Number.isFinite(first)).toBe(true);
    expect(first).toBeGreaterThan(24 * 60 * 60 * 1000);
    expect(first).toBeLessThanOrEqual(timerLimit);
    expect(first).toBeLessThan(thirtyDays);
    let fired = 0;
    const timer = setInterval(() => {
      fired += 1;
    }, first as number);
    await new Promise((resolve) => setTimeout(resolve, 50));
    clearInterval(timer);
    expect(fired).toBe(0);
    expect(
      lotPollIntervalMs({
        active: true,
        lot: scheduled,
        syncedNowMs: now + (first as number),
      }),
    ).toBe(start - (now + (first as number)));
  });

  it.each([
    { name: 'the timer ceiling', until: 2_147_483_647, interval: 2_147_483_647 },
    { name: 'one millisecond past the timer ceiling', until: 2_147_483_648, interval: 2_147_483_647 },
    { name: 'a near start', until: 5_000, interval: 5_000 },
    { name: 'a wait shorter than one second', until: 400, interval: 1_000 },
  ])('scheduled $name waits $interval', ({ until, interval }) => {
    expect(
      lotPollIntervalMs({
        active: true,
        lot: lot({
          effectiveStatus: 'SCHEDULED',
          mark: 'SCHEDULED',
          startsAt: new Date(now + until).toISOString(),
        }),
        syncedNowMs: now,
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

  it.each([
    ['reserved', { mark: 'RESERVED' as const }],
    ['sold', { mark: 'SOLD' as const, effectiveStatus: 'ENDED' as const }],
    ['cancelled', { effectiveStatus: 'CANCELLED' as const, mark: null }],
    ['ended', { effectiveStatus: 'ENDED' as const, mark: null }],
    [
      'awaiting close',
      {
        effectiveStatus: 'AWAITING_CLOSE' as const,
        mark: null,
        endsAt: '2026-11-01T10:00:00.000Z',
      },
    ],
  ])('does not show an active extension hint for %s', (_name, patch) => {
    expect(
      presentLot({
        lot: lot(patch),
        syncedNowMs: now,
        extensionUntil: now + LOT_EXTENSION_HINT_MS,
        nowMs: now,
      }).extensionLabel,
    ).toBeNull();
  });

  it('shows an extension hint only while its device deadline is ahead', () => {
    const live = lot();
    expect(
      presentLot({
        lot: live,
        syncedNowMs: now,
        extensionUntil: now + LOT_EXTENSION_HINT_MS,
        nowMs: now,
      }).extensionLabel,
    ).toBe('Продлено на минуту: ставка в последние секунды');
    expect(
      presentLot({
        lot: live,
        syncedNowMs: now,
        extensionUntil: now + LOT_EXTENSION_HINT_MS,
        nowMs: now + LOT_EXTENSION_HINT_MS,
      }).extensionLabel,
    ).toBeNull();
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
