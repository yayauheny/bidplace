import { describe, expect, it } from 'vitest';

import { modernTokens } from '@bidplace/design-tokens';

import { productMediaStyle } from './product-media-style';

describe('product media geometry', () => {
  it('keeps one 4:5 contract for every media state', () => {
    expect(productMediaStyle()).toMatchObject({
      aspectRatio: modernTokens.ratio.productPortrait,
      borderRadius: modernTokens.radius.image,
      backgroundColor: modernTokens.color.placeholder,
    });
  });

  it('accepts fixed gallery widths without changing the ratio', () => {
    expect(productMediaStyle(440)).toMatchObject({
      width: 440,
      aspectRatio: 4 / 5,
    });
  });
});
