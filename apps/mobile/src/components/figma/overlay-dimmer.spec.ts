import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import { overlayDimmerStyle } from './overlay-dimmer';

describe('Overlay dimmer', () => {
  it('matches Frame 140 without compounding opacity', () => {
    expect(overlayDimmerStyle()).toMatchObject({
      position: 'absolute',
      backgroundColor: designTokens.color.modalDimmer,
    });
    expect(designTokens.color.modalDimmer).toBe('rgba(42, 42, 42, 0.50)');
  });
});
