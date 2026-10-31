/**
 * @vitest-environment jsdom
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useNow } from './use-now';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function Probe({
  intervalMs,
  enabled,
}: {
  intervalMs: number;
  enabled: boolean;
}) {
  const now = useNow(intervalMs, enabled);
  return createElement('span', { 'data-now': String(now) });
}

describe('useNow', () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    vi.useRealTimers();
  });

  function mount(enabled: boolean) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => {
      root?.render(createElement(Probe, { intervalMs: 1000, enabled }));
    });
  }

  function stamp() {
    return container?.querySelector('span')?.getAttribute('data-now');
  }

  it('keeps one timestamp when the clock is disabled', () => {
    mount(false);
    const first = stamp();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(stamp()).toBe(first);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('advances a single timestamp while enabled', () => {
    mount(true);
    const first = Number(stamp());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(Number(stamp())).toBe(first + 1000);
    expect(vi.getTimerCount()).toBe(1);
  });
});
