import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SEARCH_DEBOUNCE_MS,
  normalizeSearchQuery,
  scheduleDebouncedCallback,
  searchRequestQuery,
} from './search-query';

describe('search query helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('trims request query without treating spaces-only as a search', () => {
    expect(normalizeSearchQuery('  ми  ')).toBe('ми');
    expect(searchRequestQuery('   ')).toBeUndefined();
    expect(searchRequestQuery('ми')).toBe('ми');
  });

  it('fires the debounced callback after 300ms and can cancel', () => {
    const fired = vi.fn();
    const cancel = scheduleDebouncedCallback(fired, SEARCH_DEBOUNCE_MS);
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    expect(fired).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fired).toHaveBeenCalledTimes(1);

    const later = vi.fn();
    const cancelLater = scheduleDebouncedCallback(later, SEARCH_DEBOUNCE_MS);
    cancelLater();
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    expect(later).not.toHaveBeenCalled();
    cancel();
  });
});
