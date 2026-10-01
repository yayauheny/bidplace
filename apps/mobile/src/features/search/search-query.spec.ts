/**
 * @vitest-environment jsdom
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SEARCH_DEBOUNCE_MS,
  normalizeSearchQuery,
  searchRequestQuery,
  useDebouncedValue,
} from './search-query';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function DebouncedValue({
  value,
  delayMs,
}: {
  value: string;
  delayMs: number;
}) {
  const debounced = useDebouncedValue(value, delayMs);
  return createElement('output', null, debounced);
}

describe('search query helpers', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
  });

  function renderValue(value: string, delayMs = SEARCH_DEBOUNCE_MS) {
    act(() => {
      root.render(createElement(DebouncedValue, { value, delayMs }));
    });
  }

  function readValue() {
    return container.querySelector('output')?.textContent;
  }

  it('trims request query without treating spaces-only as a search', () => {
    expect(normalizeSearchQuery('  ми  ')).toBe('ми');
    expect(searchRequestQuery('   ')).toBeUndefined();
    expect(searchRequestQuery('ми')).toBe('ми');
  });

  it('keeps the latest value after rapid changes at 300ms', () => {
    renderValue('first');
    expect(readValue()).toBe('first');

    renderValue('second');
    act(() => {
      vi.advanceTimersByTime(100);
    });
    renderValue('third');
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    });
    expect(readValue()).toBe('first');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(readValue()).toBe('third');
  });

  it('restarts the timer when the delay changes', () => {
    renderValue('first', 300);
    renderValue('second', 300);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    renderValue('second', 1000);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(readValue()).toBe('first');

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(readValue()).toBe('second');
  });

  it('clears a pending update on unmount', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderValue('first');
    renderValue('second');
    act(() => {
      root.unmount();
    });
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});
