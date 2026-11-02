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

const REQUEST: CreateListingRequest = {
  type: 'FIXED',
  currency: 'BYN',
  priceMinor: 1250,
  startsAt: '2026-11-02T11:59:55.000Z',
  contactWindowHours: 24,
};

const harness = vi.hoisted(() => ({
  userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as string | null,
  publicId: 'lotPanelAa1',
  productId: '11111111-1111-4111-8111-111111111111',
  listingId: '22222222-2222-4222-8222-222222222222' as string | null,
  createListing: vi.fn(),
  cancelListing: vi.fn(),
  create: null as null | ((input: CreateListingRequest) => Promise<{ status: string; value?: boolean }>),
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
    },
  }),
}));

function Probe() {
  const created = useCreateListing(harness.publicId, harness.productId);
  const cancelled = useCancelListing(harness.publicId, harness.listingId);
  harness.create = created.submit;
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
    expect(await first).toEqual({ status: 'accepted', value: true });
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
    expect(await pending).toEqual({ status: 'accepted', value: false });
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
