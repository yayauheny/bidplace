import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  authorIdentityAvatarStyle,
  authorIdentityRowStyle,
  authorIdentitySpec,
  authorIdentityTagRowStyle,
} from './author-identity-style';

describe('Compact author identity', () => {
  it('uses the 84px compact avatar instead of the 112px profile avatar', () => {
    const spec = authorIdentitySpec();

    expect(spec.sourceNodeId).toBe('874:5591');
    expect(spec.avatar).toBe(84);
    expect(spec.height).toBe(84);
    expect(spec.width).toBe(348);
    expect(spec.avatar).not.toBe(figmaTokens.size.avatar);
    expect(spec.handle).toEqual({
      fontFamily: 'Inter_600SemiBold',
      fontSize: 24,
      lineHeight: 25,
      letterSpacing: -0.24,
      fontWeight: '600',
    });
    expect(authorIdentityAvatarStyle()).toMatchObject({
      width: 84,
      height: 84,
      borderRadius: 100,
      flexShrink: 0,
    });
    expect(authorIdentityRowStyle()).toMatchObject({
      height: 84,
      maxHeight: 84,
      overflow: 'hidden',
    });
    expect(authorIdentityTagRowStyle()).toMatchObject({
      flexWrap: 'nowrap',
      overflow: 'hidden',
      gap: 4,
    });
  });
});
