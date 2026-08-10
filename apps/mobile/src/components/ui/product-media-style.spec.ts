import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import { productMediaStyle } from './product-media-style';

describe('product media geometry', () => {
  it('keeps one 4:5 contract for every media state', () => {
    expect(productMediaStyle()).toMatchObject({
      aspectRatio: designTokens.ratio.productPortrait,
      borderRadius: designTokens.radius.image,
      backgroundColor: designTokens.color.placeholder,
    });
  });

  it('accepts fixed gallery widths without changing the ratio', () => {
    expect(productMediaStyle(440)).toMatchObject({
      width: 440,
      aspectRatio: 4 / 5,
    });
  });
});
