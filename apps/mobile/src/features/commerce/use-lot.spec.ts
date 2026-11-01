/**
 * @vitest-environment jsdom
 */
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PublicLot } from '@bidplace/contracts';

import { flush, waitFor } from '../../testing/dom';
import { commerceKeys } from '../../lib/query-cache';
import { useLot } from './use-lot';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const WORK_A = 'lotPanelAa1';
const WORK_B = 'lotPanelBb2';
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const harness = vi.hoisted(() => ({
  ready: false,
  userId: null as string | null,
  getLot: vi.fn<(publicId: string, options?: { signal?: AbortSignal }) => Promise<PublicLot | null>>(),
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

vi.mock('expo-router', async () => {
  const React = await import('react');
  return {
    useFocusEffect(effect: () => void | (() => void)) {
      React.useEffect(() => effect(), [effect]);
    },
  };
});

vi.mock('../../providers/auth-provider', () => ({
  useAuth: () => ({
    ready: harness.ready,
    user: harness.userId ? { id: harness.userId } : null,
  }),
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({ commerce: { getLot: harness.getLot } }),
}));

function lot(id: string, endsAt = '2026-11-01T12:00:00.000Z'): PublicLot {
  return {
    id,
    type: 'AUCTION',
    effectiveStatus: 'LIVE',
    currency: 'BYN',
    priceMinor: id.endsWith('a') ? 10000 : 20000,
    minimumBidMinor: 21000,
    bidCount: 1,
    startsAt: '2026-11-01T09:00:00.000Z',
    endsAt,
    contactWindowHours: 24,
    mark: 'AUCTION',
    serverNow: '2026-11-01T10:00:00.000Z',
    viewer: { role: 'buyer', isLeading: false, blockedReason: null },
  };
}

function Probe({ publicId }: { publicId: string }) {
  const [id, setId] = useState(publicId);
  const read = useLot(id);
  return createElement(
    'div',
    null,
    createElement('p', null, read.status),
    createElement('p', null, read.lot?.id ?? 'none'),
    createElement('p', null, read.extended ? 'extended' : 'plain'),
    createElement('button', { type: 'button', onClick: () => setId(WORK_B) }, 'switch-work'),
  );
}

describe('useLot', () => {
  let root: Root | null = null;
  let client: QueryClient | null = null;
  let visibility: DocumentVisibilityState = 'visible';

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    client?.clear();
    client = null;
    document.body.replaceChildren();
    harness.ready = false;
    harness.userId = null;
    harness.getLot.mockReset();
    visibility = 'visible';
    vi.useRealTimers();
  });

  function render(publicId = WORK_A) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client = queryClient;
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => {
      root?.render(
        createElement(QueryClientProvider, {
          client: queryClient,
          children: createElement(Probe, { publicId }),
        }),
      );
    });
    return container;
  }

  function text(container: HTMLElement) {
    return container.textContent ?? '';
  }

  it('does not read a lot while auth is still loading', async () => {
    harness.ready = false;
    const container = render();
    await flush();
    expect(text(container)).toContain('auth-loading');
    expect(harness.getLot).not.toHaveBeenCalled();
  });

  it('reads an anonymous lot with the request signal', async () => {
    harness.ready = true;
    harness.getLot.mockResolvedValue(null);
    const container = render();
    await waitFor(() => expect(text(container)).toContain('empty'));
    expect(harness.getLot).toHaveBeenCalledWith(
      WORK_A,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(text(container)).toContain('none');
    expect(client?.getQueryData(commerceKeys.lot(WORK_A, null))).toBeNull();
  });

  it('drops a late response from the previous user', async () => {
    harness.ready = true;
    harness.userId = USER_A;
    let resolveA: (value: PublicLot) => void = () => undefined;
    const lotA = lot('11111111-1111-4111-8111-11111111111a');
    const lotB = lot('22222222-2222-4222-8222-22222222222b');
    harness.getLot.mockImplementation(
      (_publicId, options) =>
        new Promise((resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
          resolveA = resolve;
        }),
    );
    const container = render();
    await waitFor(() => expect(harness.getLot).toHaveBeenCalledTimes(1));
    harness.userId = USER_B;
    harness.getLot.mockResolvedValue(lotB);
    act(() => {
      root?.render(
        createElement(QueryClientProvider, {
          client: client!,
          children: createElement(Probe, { publicId: WORK_A }),
        }),
      );
    });
    await waitFor(() => expect(text(container)).toContain(lotB.id));
    resolveA(lotA);
    await flush();
    expect(text(container)).toContain(lotB.id);
    expect(text(container)).not.toContain(lotA.id);
    expect(client?.getQueryData(commerceKeys.lot(WORK_A, USER_A))).toBeUndefined();
    expect(client?.getQueryData(commerceKeys.lot(WORK_A, USER_B))).toEqual(lotB);
  });

  it('does not apply a late response after the work changes', async () => {
    harness.ready = true;
    let resolveA: (value: PublicLot) => void = () => undefined;
    const lotA = lot('11111111-1111-4111-8111-11111111111a');
    const lotB = lot('22222222-2222-4222-8222-22222222222b');
    harness.getLot.mockImplementation((publicId, options) => {
      if (publicId === WORK_A) {
        return new Promise((resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
          resolveA = resolve;
        });
      }
      return Promise.resolve(lotB);
    });
    const container = render(WORK_A);
    await waitFor(() => expect(harness.getLot).toHaveBeenCalled());
    act(() => {
      [...container.querySelectorAll('button')]
        .find((button) => button.textContent === 'switch-work')
        ?.click();
    });
    await waitFor(() => expect(text(container)).toContain(lotB.id));
    resolveA(lotA);
    await flush();
    expect(text(container)).not.toContain(lotA.id);
  });

  it('keeps an extension hint for the same listing and clears it for the next one', async () => {
    harness.ready = true;
    const first = lot('11111111-1111-4111-8111-11111111111a', '2026-11-01T12:00:00.000Z');
    const extended = lot('11111111-1111-4111-8111-11111111111a', '2026-11-01T12:01:00.000Z');
    const next = lot('33333333-3333-4333-8333-33333333333c', '2026-11-01T13:00:00.000Z');
    harness.getLot.mockResolvedValue(first);
    const container = render();
    await waitFor(() => {
      expect(text(container)).toContain('ready');
      expect(text(container)).toContain(first.id);
      expect(text(container)).toContain('plain');
    });
    act(() => {
      client?.setQueryData(commerceKeys.lot(WORK_A, null), extended);
    });
    await waitFor(() => expect(text(container)).toContain('extended'));
    act(() => {
      client?.setQueryData(commerceKeys.lot(WORK_A, null), next);
    });
    await waitFor(() => {
      expect(text(container)).toContain(next.id);
      expect(text(container)).toContain('plain');
    });
  });

  it('does not poll while the document is hidden', async () => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });
    harness.ready = true;
    harness.getLot.mockResolvedValue(lot('11111111-1111-4111-8111-11111111111a'));
    const container = render();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(text(container)).toContain('ready');
    const started = harness.getLot.mock.calls.length;
    visibility = 'hidden';
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(harness.getLot.mock.calls.length).toBe(started);
  });
});
