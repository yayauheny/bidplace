import { describe, expect, it } from 'vitest';

import { modernTokens } from '@bidplace/design-tokens';

import { buttonLayoutStyle } from './button-layout';

describe('button layout variants', () => {
  it('uses content width by default', () => {
    expect(buttonLayoutStyle()).toMatchObject({
      alignSelf: 'flex-start',
      paddingHorizontal: modernTokens.space.x5,
    });
    expect(buttonLayoutStyle()).not.toHaveProperty('width');
  });

  it('uses compact padding without stretching', () => {
    expect(buttonLayoutStyle('compact')).toMatchObject({
      alignSelf: 'flex-start',
      paddingHorizontal: modernTokens.space.x3,
    });
    expect(buttonLayoutStyle('compact')).not.toHaveProperty('width');
  });

  it('requires an explicit block variant for full container width', () => {
    expect(buttonLayoutStyle('block')).toMatchObject({
      alignSelf: 'stretch',
      width: '100%',
    });
  });
});
