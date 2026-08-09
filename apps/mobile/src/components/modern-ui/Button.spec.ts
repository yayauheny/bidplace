import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import {
  buttonContentLayoutStyle,
  buttonLayoutStyle,
  buttonLoadingOverlayStyle,
} from './button-layout';

describe('button layout variants', () => {
  it('uses content width by default', () => {
    expect(buttonLayoutStyle()).toMatchObject({
      alignSelf: 'flex-start',
      paddingHorizontal: designTokens.space.x5,
    });
    expect(buttonLayoutStyle()).not.toHaveProperty('width');
  });

  it('uses compact padding without stretching', () => {
    expect(buttonLayoutStyle('compact')).toMatchObject({
      alignSelf: 'flex-start',
      paddingHorizontal: designTokens.space.x3,
    });
    expect(buttonLayoutStyle('compact')).not.toHaveProperty('width');
  });

  it('requires an explicit block variant for full container width', () => {
    expect(buttonLayoutStyle('block')).toMatchObject({
      alignSelf: 'stretch',
      width: '100%',
    });
  });

  it('does not add an idle gap when a button has no icon', () => {
    expect(buttonContentLayoutStyle(false)).toMatchObject({
      position: 'relative',
      gap: 0,
    });
    expect(buttonContentLayoutStyle(true).gap).toBe(designTokens.space.x2);
  });

  it('overlays the busy spinner on an invisible sizing layer', () => {
    expect(buttonLoadingOverlayStyle()).toMatchObject({
      position: 'absolute',
      left: '50%',
      top: '50%',
    });
  });
});
