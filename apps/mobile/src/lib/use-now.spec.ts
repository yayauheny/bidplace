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

  function mount(enabled: boolean, intervalMs = 1000, time = 1_000) {
    vi.useFakeTimers();
    vi.setSystemTime(time);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    render(enabled, intervalMs);
  }

  function render(enabled: boolean, intervalMs = 1000) {
    act(() => {
      root?.render(createElement(Probe, { intervalMs, enabled }));
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

  it('reads the current time as soon as the clock is enabled', () => {
    mount(false, 1000, 1000);
    expect(stamp()).toBe('1000');
    vi.setSystemTime(61000);
    render(true);
    expect(stamp()).toBe('61000');
    expect(vi.getTimerCount()).toBe(1);
  });

  it('clears the timer when disabled, changed, re-enabled, or unmounted', () => {
    mount(true, 1000, 1000);
    expect(vi.getTimerCount()).toBe(1);
    render(false);
    expect(vi.getTimerCount()).toBe(0);
    render(true, 500);
    expect(vi.getTimerCount()).toBe(1);
    render(true, 250);
    expect(vi.getTimerCount()).toBe(1);
    act(() => {
      root?.unmount();
    });
    root = undefined;
    expect(vi.getTimerCount()).toBe(0);
  });
});
