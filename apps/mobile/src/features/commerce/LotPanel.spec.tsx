/**
 * @vitest-environment jsdom
 */
import { act, createElement, forwardRef, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { blackColorMap, lightColorMap } from '@bidplace/design-tokens';
import type { PublicLot } from '@bidplace/contracts';

import { ThemeProvider } from '../../providers/theme-provider';
import { LotPanel } from './LotPanel';
import type { LotRead } from './use-lot';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

vi.mock('expo-router', () => ({
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
  ThemeProvider: ({ children }: { children?: ReactNode }) => children,
  Link: ({ children }: { children?: ReactNode }) => children,
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web', select: (options: { web?: unknown }) => options.web },
  StyleSheet: { create: <T,>(styles: T) => styles, flatten: (style: unknown) => style, absoluteFill: {}, hairlineWidth: 1 },
  AccessibilityInfo: {
    isReduceMotionEnabled: async () => false,
    addEventListener: () => ({ remove() {} }),
  },
  View: forwardRef(function View(
    props: { children?: ReactNode; testID?: string; style?: unknown },
    ref,
  ) {
    return createElement(
      'div',
      { ref, 'data-testid': props.testID, 'data-style': JSON.stringify(props.style ?? {}) },
      props.children,
    );
  }),
  Text: ({ children, style }: { children?: ReactNode; style?: unknown }) =>
    createElement('span', { 'data-style': JSON.stringify(style ?? {}) }, children),
  Pressable: forwardRef(function Pressable(
    props: {
      children?: ReactNode | ((state: { pressed: boolean; hovered: boolean; focused: boolean }) => ReactNode);
      onPress?: () => void;
      accessibilityLabel?: string;
    },
    ref,
  ) {
    const children =
      typeof props.children === 'function'
        ? props.children({ pressed: false, hovered: false, focused: false })
        : props.children;
    return createElement(
      'button',
      {
        ref,
        type: 'button',
        'aria-label': props.accessibilityLabel,
        onClick: () => props.onPress?.(),
      },
      children,
    );
  }),
  ActivityIndicator: () => null,
}));

vi.mock('react-native-svg', () => ({
  Svg: ({ children }: { children?: ReactNode }) => createElement('svg', null, children),
  Defs: ({ children }: { children?: ReactNode }) => createElement('defs', null, children),
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
    endsAt: '2026-11-01T12:00:30.000Z',
    contactWindowHours: 24,
    mark: 'AUCTION',
    serverNow: '2026-11-01T10:00:00.000Z',
    viewer: { role: 'buyer', isLeading: false, blockedReason: null },
    ...patch,
  };
}

function read(patch: Partial<LotRead> & { lot?: PublicLot | null } = {}): LotRead {
  return {
    status: 'ready',
    lot: lot(),
    extended: false,
    active: false,
    dataUpdatedAt: Date.now(),
    refetch: vi.fn(async () => ({}) as never),
    ...patch,
  };
}

describe('LotPanel', () => {
  let root: Root | undefined;
  const host = document.createElement('div');
  document.body.append(host);

  afterEach(() => {
    act(() => root?.unmount());
    host.replaceChildren();
    vi.useRealTimers();
  });

  function render(value: LotRead, theme: 'light' | 'black' = 'light') {
    act(() => {
      root = createRoot(host);
      root.render(
        createElement(ThemeProvider, {
          theme,
          children: createElement(LotPanel, { read: value }),
        }),
      );
    });
  }

  function shown() {
    return (host.textContent ?? '').replace(/[\u00a0\u202f]/g, ' ');
  }

  it('shows a loading line before the sale is known', () => {
    render(read({ status: 'loading', lot: null }));
    expect(shown()).toContain('Проверяем, есть ли продажа');
    expect(host.querySelector('button')).toBeNull();
  });

  it('shows an error and retry instead of an empty portfolio', () => {
    const refetch = vi.fn(async () => ({}) as never);
    render(read({ status: 'error', lot: null, refetch }));
    expect(shown()).toContain('Не удалось загрузить продажу.');
    expect(shown()).not.toContain('нет');
    const button = host.querySelector('button');
    expect(button?.textContent).toContain('Повторить');
    act(() => button?.click());
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders nothing for a successful empty lot', () => {
    render(read({ status: 'empty', lot: null }));
    expect(shown()).toBe('');
  });

  it('marks a background failure without hiding the last lot', () => {
    const refetch = vi.fn(async () => ({}) as never);
    render(read({ status: 'stale', refetch }));
    expect(shown()).toContain('Данные продажи устарели');
    expect(shown()).toContain('1 250 BYN');
    expect(shown()).not.toContain('Обновляем');
    act(() => host.querySelector('button')?.click());
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('offers retry when an empty lot fails in the background', () => {
    render(read({ status: 'empty-stale', lot: null }));
    expect(shown()).toContain('Данные продажи устарели');
    expect(host.querySelector('button')?.textContent).toContain('Повторить');
  });

  it('shows the auction price and timer without a bid button', () => {
    render(read());
    expect(shown()).toContain('Текущая цена');
    expect(shown()).toContain('1 250 BYN');
    expect(shown()).toContain('2 ставки');
    expect(shown()).toContain('2 ч 0 мин');
    expect(host.querySelector('button')).toBeNull();
    expect(shown()).not.toContain('Сделать ставку');
  });

  it('uses the theme ink for the price in light and black', () => {
    for (const theme of ['light', 'black'] as const) {
      render(read(), theme);
      const price = [...host.querySelectorAll('span')].find((node) =>
        (node.textContent ?? '').includes('BYN'),
      );
      const raw = JSON.parse(price?.getAttribute('data-style') ?? 'null') as
        | { color?: string }
        | Array<{ color?: string } | null>;
      const style = Array.isArray(raw)
        ? Object.assign({}, ...raw.filter((item) => item && typeof item === 'object'))
        : raw;
      const palette = theme === 'light' ? lightColorMap : blackColorMap;
      expect(style.color).toBe(palette.ink);
    }
  });

  it.each([
    ['reserved', { mark: 'RESERVED' as const }, 'Забронировано'],
    ['sold', { mark: 'SOLD' as const, effectiveStatus: 'ENDED' as const }, 'Продано'],
  ])('hides buy and bid actions for %s', (_name, patch, label) => {
    render(read({ lot: lot(patch) }));
    expect(shown()).toContain(label);
    expect(host.querySelector('button')).toBeNull();
    expect(shown()).not.toContain('Купить');
    expect(shown()).not.toContain('Сделать ставку');
  });

  it('shows the author lock as text', () => {
    render(
      read({
        lot: lot({
          viewer: { role: 'seller', isLeading: false, blockedReason: null },
        }),
      }),
    );
    expect(shown()).toContain('Аукцион со ставками снять нельзя.');
    expect(host.querySelector('button')).toBeNull();
  });
});
