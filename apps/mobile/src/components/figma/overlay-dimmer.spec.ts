import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import { overlayDimmerStyle } from './overlay-dimmer';

describe('Overlay dimmer', () => {
  it('matches Frame 140 without compounding opacity', () => {
    expect(overlayDimmerStyle()).toMatchObject({
      position: 'absolute',
      backgroundColor: figmaTokens.color.modalDimmer,
    });
    expect(figmaTokens.color.modalDimmer).toBe('rgba(42, 42, 42, 0.50)');
  });
});
