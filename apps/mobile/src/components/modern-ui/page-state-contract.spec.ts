import { describe, expect, it } from 'vitest';

import { getPageStateMode } from './page-state-contract';

describe('page state contract', () => {
  it('keeps loading separate from retryable errors', () => {
    expect(getPageStateMode({ loading: true, retry: true })).toBe('loading');
    expect(getPageStateMode({ loading: false, retry: true })).toBe('error');
  });

  it('represents an empty state without inventing a retry action', () => {
    expect(getPageStateMode({ loading: false, retry: false })).toBe('empty');
  });
});
