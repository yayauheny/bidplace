import { describe, expect, it } from 'vitest';

import { getMotionDuration } from './motion';

describe('reduced motion contract', () => {
  it('removes animation duration when motion is reduced', () => {
    expect(getMotionDuration(true, 180)).toBe(0);
  });

  it('preserves the shared duration when motion is allowed', () => {
    expect(getMotionDuration(false, 180)).toBe(180);
  });
});
