import { describe, expect, it } from 'vitest';

import {
  getWorkCoverOverlay,
  workCoverAccessibilityLabel,
  workCoverCommerceFields,
} from './work-cover-fields';

const sample = {
  title: 'Желтый сапфир',
  authorSlug: 'quantumparadox',
  price: '2 510 BYN',
  timer: '13д 24ч 40м',
  status: 'live' as const,
};

describe('Work cover overlay', () => {
  it('keeps commerce slots in the component but hides them for portfolio MVP', () => {
    expect(workCoverCommerceFields).toEqual(['price', 'timer', 'status']);
    expect(getWorkCoverOverlay(sample, 'portfolio')).toEqual({
      title: 'Желтый сапфир',
      authorSlug: 'quantumparadox',
      price: null,
      timer: null,
      status: null,
    });
  });

  it('does not mention price or auction status in the portfolio label', () => {
    const overlay = getWorkCoverOverlay(sample, 'portfolio');
    const label = workCoverAccessibilityLabel(overlay);

    expect(label).toBe('Желтый сапфир — @quantumparadox');
    expect(label).not.toMatch(/BYN|Торги|Анонс/);
  });

  it('restores commerce overlay when explicitly enabled', () => {
    const overlay = getWorkCoverOverlay(sample, 'commerce');

    expect(overlay.price).toBe('2 510 BYN');
    expect(overlay.status).toBe('live');
    expect(workCoverAccessibilityLabel(overlay)).toContain('Торги');
  });
});
