import { describe, expect, it } from 'vitest';

import {
  creatorAmbientLayers,
  productAmbientLayers,
} from './ambient-image-background-style';

describe('ambient background presets', () => {
  it('keeps the product atmosphere neutral and fades into the warm surface', () => {
    expect(productAmbientLayers.cool).toHaveLength(3);
    expect(productAmbientLayers.warm).toHaveLength(3);
    expect(productAmbientLayers.veil.at(-1)).toBe('#FFFFFF');
  });

  it('keeps the creator atmosphere independent from profile imagery', () => {
    expect(creatorAmbientLayers.atmosphere).toHaveLength(3);
    expect(creatorAmbientLayers.veil.at(-1)).toBe('#FFFFFF');
  });
});
