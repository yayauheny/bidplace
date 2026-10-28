import { describe, expect, it } from 'vitest';

import { motionPressableFeedback } from './motion-pressable-feedback';

describe('MotionPressable feedback', () => {
  it('keeps dock feedback subtle and short-lived', () => {
    expect(motionPressableFeedback('dock', false)).toEqual({
      pressedOpacity: 0.82,
      transitionDuration: 80,
    });
  });

  it('removes animated opacity feedback for reduced motion', () => {
    expect(motionPressableFeedback('dock', true)).toEqual({
      pressedOpacity: 1,
      transitionDuration: 0,
    });
  });
});
