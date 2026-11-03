/**
 * @vitest-environment jsdom
 */
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ApiClientError } from '@bidplace/api-client';
import { ApiErrorCode, type CreateListingRequest } from '@bidplace/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { authKeys, portfolioKeys } from '../../lib/query-cache';
import { useCancelListing, useCreateListing } from './use-lot-actions';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const WORK_A = 'lotPanelAa1';
const WORK_B = 'lotPanelBb2';
const PRODUCT = '11111111-1111-4111-8111-111111111111';
const LISTING = '22222222-2222-4222-8222-222222222222';

function openLot(patch: { priceMinor?: number } = {}) {
  return {
    id: LISTING,
    type: 'FIXED' as const,
    effectiveStatus: 'LIVE' as const,
    currency: 'BYN' as const,
    priceMinor: patch.priceMinor ?? 1250,
    minimumBidMinor: null,
    bidCount: 0,
    startsAt: '2026-11-02T12:00:00.000Z',
    endsAt: null,
    contactWindowHours: 24,
    mark: 'BUY' as const,
    serverNow: '2026-11-02T12:00:00.000Z',
    viewer: { role: 'seller' as const, isLeading: false, blockedReason: null },
  };
}

const REQUEST: CreateListingRequest = {
  type: 'FIXED',
  currency: 'BYN',
  priceMinor: 1250,
  startMode: 'now',
  contactWindowHours: 24,
};

const harness = vi.hoisted(() => ({
  userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as string | null,
  publicId: 'lotPanelAa1',
  productId: '11111111-1111-4111-8111-111111111111',
  listingId: '22222222-2222-4222-8222-222222222222' as string | null,
  createListing: vi.fn(),
  cancelListing: vi.fn(),
  getLot: vi.fn(),
  create: null as null | ((input: CreateListingRequest) => Promise<{ status: string; value?: { applied: boolean; notice: string | null; outcome: string } }>),
  check: null as null | (() => Promise<unknown>),
  cancel: null as null | (() => Promise<{ status: string; value?: boolean }>),
  bump: () => {},
}));

vi.mock('../../providers/auth-provider', () => ({
  useAuth: () => ({
    user: harness.userId ? { id: harness.userId } : null,
  }),
}));

vi.mock('../auth/turnstile-widget', () => ({
  useInvisibleTurnstile: () => ({ getToken: async () => null }),
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    commerce: {
      createListing: harness.createListing,
      cancelListing: harness.cancelListing,
      getLot: harness.getLot,
    },
  }),
}));

function Probe() {
  const created = useCreateListing(harness.publicId, harness.productId);
  const cancelled = useCancelListing(harness.publicId, harness.listingId);
  harness.create = created.submit;
  harness.check = created.checkAgain;
  harness.cancel = cancelled.submit;
  return null;
}

function App() {
  const [tick, setTick] = useState(0);
  harness.bump = () => setTick((value) => value + 1);
  return createElement(Probe, { tick });
}

describe('listing commands', () => {
  let root: Root | null = null;
  let client: QueryClient | null = null;

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    client?.clear();
    client = null;
    harness.userId = USER_A;
    harness.publicId = WORK_A;
    harness.productId = PRODUCT;
    harness.listingId = LISTING;
    harness.createListing.mockReset();
    harness.cancelListing.mockReset();
    harness.getLot.mockReset();
    harness.getLot.mockResolvedValue(null);
    harness.create = null;
    harness.cancel = null;
  });

  function render() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(authKeys.session, { id: USER_A });
    queryClient.setQueryData(portfolioKeys.work(WORK_A), { publicId: WORK_A });
    queryClient.setQueryData(portfolioKeys.work(WORK_B), { publicId: WORK_B });
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

  it('sends one create for a double press and refreshes the same work', async () => {
    let resolveCreate: (value: { id: string }) => void = () => {};
    harness.createListing.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );
    render();
    const first = harness.create?.(REQUEST);
    const second = await harness.create?.(REQUEST);
    expect(second).toEqual({ status: 'busy' });
    await act(async () => {
      await Promise.resolve();
    });
    expect(harness.createListing).toHaveBeenCalledTimes(1);
    expect(harness.createListing).toHaveBeenCalledWith(PRODUCT, REQUEST);
    resolveCreate({ id: LISTING });
    await act(async () => {
      await first;
    });
    expect(await first).toEqual({
      status: 'accepted',
      value: { applied: true, outcome: 'created', notice: null },
    });
    expect(client?.getQueryState(portfolioKeys.work(WORK_A))?.isInvalidated).toBe(true);
    expect(client?.getQueryState(portfolioKeys.work(WORK_B))?.isInvalidated).toBeFalsy();
  });

  it('does not refresh another account when the create response arrives late', async () => {
    let resolveCreate: (value: { id: string }) => void = () => {};
    harness.createListing.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );
    render();
    const pending = harness.create?.(REQUEST);
    await act(async () => {
      await Promise.resolve();
    });
    harness.userId = USER_B;
    harness.publicId = WORK_B;
    harness.productId = '33333333-3333-4333-8333-333333333333';
    act(() => harness.bump());
    resolveCreate({ id: LISTING });
    await act(async () => {
      await pending;
    });
    expect(await pending).toEqual({
      status: 'accepted',
      value: { applied: false, outcome: 'created', notice: null },
    });
    expect(client?.getQueryState(portfolioKeys.work(WORK_A))?.isInvalidated).toBeFalsy();
    expect(client?.getQueryState(portfolioKeys.work(WORK_B))?.isInvalidated).toBeFalsy();
  });

  it('reports an open sale without attributing it to the lost create', async () => {
    harness.createListing.mockRejectedValue(
      new ApiClientError('socket', { kind: 'network', status: 0, code: null }),
    );
    harness.getLot.mockResolvedValue(openLot());
    render();
    let result: { status: string; value?: { applied: boolean; notice: string | null } } | undefined;
    await act(async () => {
      result = await harness.create?.(REQUEST);
    });
    expect(harness.createListing).toHaveBeenCalledTimes(1);
    expect(result?.value).toMatchObject({ applied: true, outcome: 'open' });
    expect(result?.value?.notice).toMatch(/уже в продаже/);
    expect(client?.getQueryState(portfolioKeys.work(WORK_A))?.isInvalidated).toBe(true);
  });

  it('shows the existing sale when the lost create does not match it', async () => {
    harness.createListing.mockRejectedValue(
      new ApiClientError('in sale', {
        kind: 'conflict',
        status: 409,
        code: ApiErrorCode.PRODUCT_IN_SALE,
      }),
    );
    harness.getLot.mockResolvedValue(openLot({ priceMinor: 9_900 }));
    render();
    let result: { status: string; value?: { applied: boolean; notice: string | null } } | undefined;
    await act(async () => {
      result = await harness.create?.(REQUEST);
    });
    expect(result?.status).toBe('accepted');
    expect(result?.value?.applied).toBe(true);
    expect(result?.value?.notice).toMatch(/уже в продаже/);
    expect(harness.createListing).toHaveBeenCalledTimes(1);
  });

  it('keeps an unknown create blocked and allows only a fresh read', async () => {
    harness.createListing.mockRejectedValue(
      new ApiClientError('socket', { kind: 'network', status: 0, code: null }),
    );
    render();
    let result: { status: string } | undefined;
    await act(async () => {
      result = await harness.create?.(REQUEST);
    });
    expect(result).toMatchObject({ status: 'accepted', value: { outcome: 'unknown' } });
    await act(async () => { await harness.create?.(REQUEST); await harness.check?.(); });
    expect(harness.createListing).toHaveBeenCalledTimes(1);
    expect(harness.getLot).toHaveBeenCalledTimes(3);
    expect(harness.getLot).toHaveBeenCalledWith(WORK_A);
  });

  it.each(['absent', 'terminal', 'read-error', 'other-viewer'])('keeps the write uncertain after %s and rechecks without posting', async (state) => {
    harness.createListing.mockRejectedValue(new ApiClientError('timeout', { kind: 'network', status: 0, code: null }));
    if (state === 'read-error') harness.getLot.mockRejectedValueOnce(new Error('offline'));
    else harness.getLot.mockResolvedValueOnce(state === 'absent' ? null : { ...openLot(), ...(state === 'terminal' ? { effectiveStatus: 'ENDED' } : { viewer: { role: 'buyer' } }) });
    render();
    let first: Awaited<ReturnType<NonNullable<typeof harness.create>>> | undefined;
    await act(async () => { first = await harness.create?.(REQUEST); });
    expect(first).toMatchObject({ value: { outcome: 'unknown', applied: true } });
    harness.getLot.mockResolvedValue(openLot());
    let checked: unknown;
    await act(async () => { checked = await harness.check?.(); });
    expect(checked).toMatchObject({ value: { outcome: 'open', applied: true } });
    expect(harness.createListing).toHaveBeenCalledTimes(1);
  });

  it('ignores a recovered response after switching works in the same account', async () => {
    let resolveLot: (value: ReturnType<typeof openLot>) => void = () => {};
    harness.createListing.mockRejectedValue(new ApiClientError('timeout', { kind: 'network', status: 0, code: null }));
    harness.getLot.mockImplementation(() => new Promise((resolve) => { resolveLot = resolve; }));
    render();
    const pending = harness.create?.(REQUEST);
    await act(async () => { await Promise.resolve(); });
    harness.publicId = WORK_B;
    act(() => harness.bump());
    resolveLot(openLot());
    await act(async () => { await pending; });
    expect(await pending).toMatchObject({ value: { applied: false, notice: null } });
    expect(client?.getQueryState(portfolioKeys.work(WORK_A))?.isInvalidated).toBeFalsy();
  });

  it('ignores a response after leaving and returning to the same account and work', async () => {
    let resolveLot: (value: ReturnType<typeof openLot>) => void = () => {};
    harness.createListing.mockRejectedValue(new ApiClientError('timeout', { kind: 'network', status: 0, code: null }));
    harness.getLot.mockImplementation(() => new Promise((resolve) => { resolveLot = resolve; }));
    render();
    const pending = harness.create?.(REQUEST);
    await act(async () => { await Promise.resolve(); });
    harness.userId = USER_B;
    act(() => harness.bump());
    harness.userId = USER_A;
    act(() => harness.bump());
    resolveLot(openLot());
    await act(async () => { await pending; });
    expect(await pending).toMatchObject({ value: { applied: false, notice: null } });
    expect(client?.getQueryState(portfolioKeys.work(WORK_A))?.isInvalidated).toBeFalsy();
  });

  it('does not apply a recovered lot after the account changes', async () => {
    let resolveLot: (value: ReturnType<typeof openLot>) => void = () => {};
    harness.createListing.mockRejectedValue(
      new ApiClientError('socket', { kind: 'network', status: 0, code: null }),
    );
    harness.getLot.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLot = resolve;
        }),
    );
    render();
    const pending = harness.create?.(REQUEST);
    await act(async () => {
      await Promise.resolve();
    });
    harness.userId = USER_B;
    harness.publicId = WORK_B;
    harness.productId = '33333333-3333-4333-8333-333333333333';
    act(() => harness.bump());
    resolveLot(openLot());
    await act(async () => {
      await pending;
    });
    expect(await pending).toEqual({
      status: 'accepted',
      value: { applied: false, outcome: 'unknown', notice: null },
    });
    expect(client?.getQueryState(portfolioKeys.work(WORK_A))?.isInvalidated).toBeFalsy();
    expect(client?.getQueryState(portfolioKeys.work(WORK_B))?.isInvalidated).toBeFalsy();
  });

  it('refreshes the captured work when the server says the lot already exists', async () => {
    render();
    harness.createListing.mockRejectedValue(
      new ApiClientError('in sale', {
        kind: 'conflict',
        status: 409,
        code: ApiErrorCode.PRODUCT_IN_SALE,
      }),
    );
    await act(async () => {
      await harness.create?.(REQUEST);
    });
    expect(client?.getQueryState(portfolioKeys.work(WORK_A))?.isInvalidated).toBe(true);
  });

  it('cancels once and ignores a second press while the request is open', async () => {
    let resolveCancel: (value: { id: string }) => void = () => {};
    harness.cancelListing.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCancel = resolve;
        }),
    );
    render();
    const first = harness.cancel?.();
    const second = await harness.cancel?.();
    expect(second).toEqual({ status: 'busy' });
    await act(async () => {
      await Promise.resolve();
    });
    expect(harness.cancelListing).toHaveBeenCalledTimes(1);
    expect(harness.cancelListing).toHaveBeenCalledWith(LISTING);
    resolveCancel({ id: LISTING });
    await act(async () => {
      await first;
    });
    expect(await first).toEqual({ status: 'accepted', value: true });
  });
});
