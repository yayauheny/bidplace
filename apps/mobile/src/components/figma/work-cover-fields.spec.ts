import { describe, expect, it } from 'vitest';

import {
  getWorkCoverOverlay,
  workCoverAccessibilityLabel,
} from './work-cover-fields';

const sample = {
  title: 'Желтый сапфир',
  authorSlug: 'quantumparadox',
};

describe('Work cover overlay', () => {
  it('exposes title and author only', () => {
    expect(getWorkCoverOverlay(sample)).toEqual({
      title: 'Желтый сапфир',
      authorSlug: 'quantumparadox',
    });
  });

  it('does not mention price or auction status in the label', () => {
    const overlay = getWorkCoverOverlay(sample);
    const label = workCoverAccessibilityLabel(overlay);

    expect(label).toBe('Желтый сапфир — @quantumparadox');
    expect(label).not.toMatch(/BYN|Торги|Анонс|Завершено/);
  });
});
