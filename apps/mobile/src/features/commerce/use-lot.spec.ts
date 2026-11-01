/**
 * @vitest-environment jsdom
 */
import { act, createElement, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ApiClientError } from '@bidplace/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PublicLot } from '@bidplace/contracts';

import { flush, waitFor } from '../../testing/dom';
import { commerceKeys } from '../../lib/query-cache';
import { ThemeProvider } from '../../providers/theme-provider';
import { LotPanel } from './LotPanel';
import { LOT_EXTENSION_HINT_MS } from './lot-view';
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
  Platform: { OS: 'web', select: (options: { web?: unknown }) => options.web },
  StyleSheet: {
    create: <T,>(styles: T) => styles,
    flatten: (style: unknown) => style,
    absoluteFill: {},
    hairlineWidth: 1,
  },
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Text: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  Pressable: ({
    children,
    onPress,
    accessibilityLabel,
  }: {
    children?:
      | ReactNode
      | ((state: { pressed: boolean; hovered: boolean; focused: boolean }) => ReactNode);
    onPress?: () => void;
    accessibilityLabel?: string;
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        'aria-label': accessibilityLabel,
        onClick: () => onPress?.(),
      },
      typeof children === 'function'
        ? children({ pressed: false, hovered: false, focused: false })
        : children,
    ),
  ActivityIndicator: () => null,
}));

vi.mock('react-native-svg', () => ({
  Svg: () => null,
  Defs: () => null,
  LinearGradient: () => null,
  Rect: () => null,
  Stop: () => null,
  Circle: () => null,
  Ellipse: () => null,
  Path: () => null,
}));

vi.mock('@hugeicons/react-native', () => ({
  HugeiconsIcon: () => null,
}));

vi.mock('expo-router', async () => {
  const React = await import('react');
  return {
    DefaultTheme: {
      colors: {
        background: '',
        card: '',
        primary: '',
        border: '',
        text: '',
        notification: '',
      },
    },
    ThemeProvider: ({ children }: { children?: React.ReactNode }) => children,
    Link: ({ children }: { children?: React.ReactNode }) => children,
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
    createElement(
      'p',
      null,
      read.extensionUntil === null ? 'plain' : 'armed',
    ),
    createElement(LotPanel, { read }),
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
          children: createElement(ThemeProvider, {
            theme: 'light',
            children: createElement(Probe, { publicId }),
          }),
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
          children: createElement(ThemeProvider, {
            theme: 'light',
            children: createElement(Probe, { publicId: WORK_A }),
          }),
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

  it('shows an extension hint briefly for the same listing and clears it for the next one', async () => {
    vi.useFakeTimers();
    harness.ready = true;
    const first = lot('11111111-1111-4111-8111-11111111111a', '2026-11-01T12:00:00.000Z');
    const extended = lot('11111111-1111-4111-8111-11111111111a', '2026-11-01T12:01:00.000Z');
    const same = lot('11111111-1111-4111-8111-11111111111a', '2026-11-01T12:01:00.000Z');
    const again = lot('11111111-1111-4111-8111-11111111111a', '2026-11-01T12:02:00.000Z');
    const next = lot('33333333-3333-4333-8333-33333333333c', '2026-11-01T13:00:00.000Z');
    harness.getLot.mockResolvedValue(first);
    const container = render();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(text(container)).toContain('ready');
    expect(text(container)).toContain(first.id);
    expect(text(container)).toContain('plain');
    expect(text(container)).not.toContain('Продлено на минуту');
    act(() => {
      client?.setQueryData(commerceKeys.lot(WORK_A, null), extended);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(text(container)).toContain('armed');
    expect(text(container)).toContain('Продлено на минуту');
    expect(text(container)).toContain('2 ч 1 мин');
    const calls = harness.getLot.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    act(() => {
      client?.setQueryData(commerceKeys.lot(WORK_A, null), same);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LOT_EXTENSION_HINT_MS - 1_000);
    });
    expect(text(container)).not.toContain('Продлено на минуту');
    expect(harness.getLot.mock.calls.length).toBe(calls);
    act(() => {
      client?.setQueryData(commerceKeys.lot(WORK_A, null), again);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(text(container)).toContain('Продлено на минуту');
    act(() => {
      client?.setQueryData(commerceKeys.lot(WORK_A, null), next);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(text(container)).toContain(next.id);
    expect(text(container)).toContain('plain');
    expect(text(container)).not.toContain('Продлено на минуту');
  });

  it('drops an expired extension hint on return and does not carry it to another viewer, work, or empty lot', async () => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });
    harness.ready = true;
    harness.userId = USER_A;
    const first = lot('11111111-1111-4111-8111-11111111111a', '2026-11-01T12:00:00.000Z');
    const extended = lot('11111111-1111-4111-8111-11111111111a', '2026-11-01T12:01:00.000Z');
    const otherUser = lot('22222222-2222-4222-8222-22222222222b', '2026-11-01T13:00:00.000Z');
    harness.getLot.mockResolvedValue(first);
    const container = render();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    act(() => {
      client?.setQueryData(commerceKeys.lot(WORK_A, USER_A), extended);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(text(container)).toContain('Продлено на минуту');
    visibility = 'hidden';
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LOT_EXTENSION_HINT_MS + 1_000);
    });
    visibility = 'visible';
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(text(container)).not.toContain('Продлено на минуту');
    expect(text(container)).toMatch(/\d+ ч \d+ мин/);

    harness.userId = USER_B;
    harness.getLot.mockResolvedValue(otherUser);
    act(() => {
      root?.render(
        createElement(QueryClientProvider, {
          client: client!,
          children: createElement(ThemeProvider, {
            theme: 'light',
            children: createElement(Probe, { publicId: WORK_A }),
          }),
        }),
      );
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(text(container)).toContain(otherUser.id);
    expect(text(container)).toContain('plain');
    expect(text(container)).not.toContain('Продлено на минуту');

    act(() => {
      [...container.querySelectorAll('button')]
        .find((button) => button.textContent === 'switch-work')
        ?.click();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(text(container)).toContain('plain');
    expect(text(container)).not.toContain('Продлено на минуту');
    act(() => {
      client?.setQueryData(commerceKeys.lot(WORK_B, USER_B), null);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(text(container)).toContain('empty');
    expect(text(container)).toContain('plain');
    expect(text(container)).not.toContain('Продлено на минуту');
  });

  it('expires a shown extension hint when the lot read fails and keeps retry', async () => {
    vi.useFakeTimers();
    harness.ready = true;
    const first = lot('11111111-1111-4111-8111-11111111111a', '2026-11-01T12:00:00.000Z');
    const extended = lot('11111111-1111-4111-8111-11111111111a', '2026-11-01T12:01:00.000Z');
    harness.getLot.mockResolvedValue(first);
    const container = render();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    act(() => {
      client?.setQueryData(commerceKeys.lot(WORK_A, null), extended);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(text(container)).toContain('Продлено на минуту');
    harness.getLot.mockRejectedValue(
      new ApiClientError('down', { kind: 'forbidden', status: 403 }),
    );
    const pending = client?.refetchQueries({
      queryKey: commerceKeys.lot(WORK_A, null),
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    await pending;
    expect(text(container)).toContain('Данные продажи устарели.');
    expect(text(container)).toContain('Повторить');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LOT_EXTENSION_HINT_MS + 1_000);
    });
    expect(text(container)).not.toContain('Продлено на минуту');
    expect(text(container)).toContain('Данные продажи устарели.');
    expect(text(container)).toContain('Повторить');
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
