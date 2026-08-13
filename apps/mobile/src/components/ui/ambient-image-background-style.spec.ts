import { describe, expect, it } from 'vitest';

import {
  ambientGradientColors,
  ambientGradientLocations,
  ambientImageOverscanScale,
} from './ambient-image-background-style';

describe('ambient image background geometry', () => {
  it('uses one explicit gradient with ascending stops that ends at the warm surface', () => {
    expect(ambientGradientLocations).toEqual([0.3, 0.5, 0.72, 0.92]);
    expect(ambientGradientColors).toHaveLength(4);
    expect(ambientGradientColors.at(-1)).toBe('#FBFBF8');
  });

  it('keeps the blurred media inside a bounded overscan range', () => {
    expect(ambientImageOverscanScale).toBeGreaterThanOrEqual(1.08);
    expect(ambientImageOverscanScale).toBeLessThanOrEqual(1.15);
  });
});
