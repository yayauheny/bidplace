/**
 * @vitest-environment jsdom
 */
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@bidplace/api-client';

import { authKeys, commerceKeys } from '../../lib/query-cache';
import { useOrderCommands } from './use-order-actions';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ORDER_A = 'orderPanel1';
const ORDER_B = 'orderPanel2';
const WORK_A = 'workpublic01';
const WORK_B = 'workpublic02';

const harness = vi.hoisted(() => ({
  userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as string | null,
  publicId: 'orderPanel1',
  workPublicId: 'workpublic01',
  acceptOrder: vi.fn(),
  accept: null as
    | null
    | ((input: undefined) => Promise<{ status: string; value?: { publicId: string } | null }>),
  bump: () => {},
}));

vi.mock('../../providers/auth-provider', () => ({
  useAuth: () => ({
    user: harness.userId ? { id: harness.userId } : null,
  }),
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    commerce: {
      acceptOrder: harness.acceptOrder,
      declineOrder: vi.fn(),
      completeOrder: vi.fn(),
      failOrder: vi.fn(),
      updateOrderNote: vi.fn(),
      offerNextOrder: vi.fn(),
      createOrderReport: vi.fn(),
    },
  }),
}));

function order(publicId: string) {
  return { publicId, status: 'ACTIVE', dealCode: '123456' };
}

function Probe() {
  const commands = useOrderCommands(harness.publicId, harness.workPublicId);
  harness.accept = commands.accept.submit;
  return null;
}

function App() {
  const [tick, setTick] = useState(0);
  harness.bump = () => setTick((value) => value + 1);
  return createElement(Probe, { tick });
}

describe('useOrderCommands', () => {
  let root: Root | null = null;
  let client: QueryClient | null = null;

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    client?.clear();
    client = null;
    harness.userId = USER_A;
    harness.publicId = ORDER_A;
    harness.workPublicId = WORK_A;
    harness.acceptOrder.mockReset();
    harness.accept = null;
  });

  function render() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(authKeys.session, { id: USER_A });
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

  it('accepts once while the first request is still open', async () => {
    let resolveAccept: (value: ReturnType<typeof order>) => void = () => {};
    harness.acceptOrder.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAccept = resolve;
        }),
    );
    render();
    const first = harness.accept?.(undefined);
    const second = await harness.accept?.(undefined);
    expect(second).toEqual({ status: 'busy' });
    await act(async () => {
      await Promise.resolve();
    });
    expect(harness.acceptOrder).toHaveBeenCalledTimes(1);
    expect(harness.acceptOrder).toHaveBeenCalledWith(ORDER_A);
    resolveAccept(order(ORDER_A));
    await act(async () => {
      await first;
    });
    expect(client?.getQueryData(commerceKeys.order(ORDER_A))).toMatchObject({
      publicId: ORDER_A,
      status: 'ACTIVE',
    });
  });

  it('drops a late accept after the account changes', async () => {
    let resolveAccept: (value: ReturnType<typeof order>) => void = () => {};
    harness.acceptOrder.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAccept = resolve;
        }),
    );
    render();
    const pending = harness.accept?.(undefined);
    await act(async () => {
      await Promise.resolve();
    });
    harness.userId = USER_B;
    harness.publicId = ORDER_B;
    harness.workPublicId = WORK_B;
    client?.setQueryData(authKeys.session, { id: USER_B });
    act(() => harness.bump());
    resolveAccept(order(ORDER_A));
    await act(async () => {
      await pending;
    });
    expect(await pending).toEqual({ status: 'accepted', value: null });
    expect(client?.getQueryData(commerceKeys.order(ORDER_A))).toBeUndefined();
    expect(client?.getQueryData(commerceKeys.order(ORDER_B))).toBeUndefined();
  });

  it('refreshes the order when the transition is no longer allowed', async () => {
    harness.acceptOrder.mockRejectedValue(
      new ApiClientError('changed', {
        kind: 'conflict',
        status: 409,
        code: 'ORDER_TRANSITION_NOT_ALLOWED',
      }),
    );
    render();
    client?.setQueryData(commerceKeys.order(ORDER_A), order(ORDER_A));
    await act(async () => {
      await harness.accept?.(undefined);
    });
    expect(client?.getQueryState(commerceKeys.order(ORDER_A))?.isInvalidated).toBe(true);
  });

  it('does not refresh another account when a late conflict arrives', async () => {
    let rejectAccept: (error: unknown) => void = () => {};
    harness.acceptOrder.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectAccept = reject;
        }),
    );
    render();
    const pending = harness.accept?.(undefined);
    await act(async () => {
      await Promise.resolve();
    });
    harness.userId = USER_B;
    harness.publicId = ORDER_B;
    client?.setQueryData(authKeys.session, { id: USER_B });
    client?.setQueryData(commerceKeys.order(ORDER_B), order(ORDER_B));
    act(() => harness.bump());
    rejectAccept(
      new ApiClientError('changed', {
        kind: 'conflict',
        status: 409,
        code: 'ORDER_TRANSITION_NOT_ALLOWED',
      }),
    );
    await act(async () => {
      await pending;
    });
    expect(client?.getQueryState(commerceKeys.order(ORDER_B))?.isInvalidated).not.toBe(true);
  });
});
