/**
 * @vitest-environment jsdom
 */
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ApiClientError } from '@bidplace/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PublicLot } from '@bidplace/contracts';

import { commerceKeys } from '../../lib/query-cache';
import { usePlaceBid } from './use-lot-actions';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const WORK_A = 'lotPanelAa1';
const WORK_B = 'lotPanelBb2';
const LISTING = '11111111-1111-4111-8111-111111111111';

const harness = vi.hoisted(() => ({
  userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as string | null,
  publicId: 'lotPanelAa1',
  listingId: '11111111-1111-4111-8111-111111111111' as string | null,
  placeBid: vi.fn(),
  submit: null as
    | null
    | ((amountMinor: number) => Promise<{ status: string }>),
  bump: () => {},
}));

vi.mock('../../providers/auth-provider', () => ({
  useAuth: () => ({
    user: harness.userId ? { id: harness.userId } : null,
  }),
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({ commerce: { placeBid: harness.placeBid } }),
}));

vi.mock('../auth/turnstile-widget', () => ({
  useInvisibleTurnstile: () => ({ getToken: async () => null }),
}));

function lot(): PublicLot {
  return {
    id: LISTING,
    type: 'AUCTION',
    effectiveStatus: 'LIVE',
    currency: 'BYN',
    priceMinor: 50_000,
    minimumBidMinor: 51_000,
    bidCount: 2,
    startsAt: '2026-11-01T09:00:00.000Z',
    endsAt: '2026-11-01T12:00:00.000Z',
    contactWindowHours: 24,
    mark: 'AUCTION',
    serverNow: '2026-11-01T10:00:00.000Z',
    viewer: { role: 'buyer', isLeading: true, blockedReason: 'BID_ALREADY_LEADING' },
  };
}

function Probe() {
  const bid = usePlaceBid(harness.publicId, harness.listingId);
  harness.submit = bid.submit;
  return null;
}

function App() {
  const [tick, setTick] = useState(0);
  harness.bump = () => setTick((value) => value + 1);
  return createElement(Probe, { tick });
}

describe('usePlaceBid', () => {
  let root: Root | null = null;
  let client: QueryClient | null = null;

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    client?.clear();
    client = null;
    harness.userId = USER_A;
    harness.publicId = WORK_A;
    harness.listingId = LISTING;
    harness.placeBid.mockReset();
    harness.submit = null;
  });

  function render() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    client = queryClient;
    const host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    act(() => {
      root?.render(
        createElement(QueryClientProvider, {
          client: queryClient,
          children: createElement(App),
        }),
      );
    });
  }

  it('sends one request for a double press and a new key after success', async () => {
    let resolveBid: (value: { lot: PublicLot }) => void = () => {};
    harness.placeBid.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBid = resolve;
        }),
    );
    render();
    const first = harness.submit?.(50_100);
    const second = await harness.submit?.(50_100);
    expect(second).toEqual({ status: 'busy' });
    await act(async () => {
      await Promise.resolve();
    });
    expect(harness.placeBid).toHaveBeenCalledTimes(1);
    const firstKey = harness.placeBid.mock.calls[0]?.[1].idempotencyKey as string;
    resolveBid({ lot: lot() });
    await act(async () => {
      await first;
    });
    expect(client?.getQueryData(commerceKeys.lot(WORK_A, USER_A))).toMatchObject({
      id: LISTING,
    });
    harness.placeBid.mockResolvedValue({ lot: lot() });
    await act(async () => {
      await harness.submit?.(52_600);
    });
    const secondKey = harness.placeBid.mock.calls[1]?.[1].idempotencyKey as string;
    expect(secondKey).not.toBe(firstKey);
  });

  it('keeps the key when the response is lost and does not store it for another user', async () => {
    let resolveBid: (value: { lot: PublicLot }) => void = () => {};
    harness.placeBid.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBid = resolve;
        }),
    );
    render();
    const pending = harness.submit?.(50_100);
    await act(async () => {
      await Promise.resolve();
    });
    const key = harness.placeBid.mock.calls[0]?.[1].idempotencyKey as string;
    harness.userId = USER_B;
    harness.publicId = WORK_B;
    act(() => harness.bump());
    resolveBid({ lot: lot() });
    await act(async () => {
      await pending;
    });
    expect(client?.getQueryData(commerceKeys.lot(WORK_A, USER_A))).toBeUndefined();
    expect(client?.getQueryData(commerceKeys.lot(WORK_B, USER_B))).toBeUndefined();
    harness.placeBid.mockRejectedValue(
      new ApiClientError('down', { kind: 'network', status: 0 }),
    );
    await act(async () => {
      await harness.submit?.(50_100);
    });
    expect(harness.placeBid.mock.calls[1]?.[1].idempotencyKey).toBe(key);
    expect(client?.getQueryState(commerceKeys.lot(WORK_B, USER_B))?.isInvalidated).toBeFalsy();
  });

  it('invalidates the lot when the server rejects the amount', async () => {
    render();
    client?.setQueryData(commerceKeys.lot(WORK_A, USER_A), lot());
    harness.placeBid.mockRejectedValue(
      new ApiClientError('low', {
        kind: 'conflict',
        status: 409,
        code: 'BID_TOO_LOW',
      }),
    );
    await act(async () => {
      await harness.submit?.(50_100);
    });
    expect(
      client?.getQueryState(commerceKeys.lot(WORK_A, USER_A))?.isInvalidated,
    ).toBe(true);
  });
});
