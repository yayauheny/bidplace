import { describe, expect, it } from 'vitest';

import { designTokens, lightColorMap } from '@bidplace/design-tokens';

import { productMediaStyle } from './product-media-style';

describe('product media geometry', () => {
  it('keeps one 4:5 contract for every media state', () => {
    expect(productMediaStyle('100%', lightColorMap)).toMatchObject({
      aspectRatio: designTokens.ratio.productPortrait,
      borderRadius: designTokens.radius.image,
      backgroundColor: lightColorMap.placeholder,
    });
  });

  it('accepts fixed gallery widths without changing the ratio', () => {
    expect(productMediaStyle(440, lightColorMap)).toMatchObject({
      width: 440,
      aspectRatio: designTokens.ratio.productPortrait,
    });
  });
});
