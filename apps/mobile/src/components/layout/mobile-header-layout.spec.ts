import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import {
  mobileActionRadius,
  mobileControlBorderColor,
  mobileHeaderHorizontalGap,
  mobileSearchOpenBorderColor,
  mobileMenuItemSelectedBackgroundColor,
} from './mobile-header-layout';

describe('mobile-header-layout', () => {
  it('keeps derived action radius stable', () => {
    expect(mobileActionRadius).toBe(designTokens.size.touch / 2);
  });

  it('keeps extracted hex colors stable', () => {
    expect(mobileControlBorderColor).toBe('#0000000A');
    expect(mobileSearchOpenBorderColor).toBe('#14141209');
    expect(mobileMenuItemSelectedBackgroundColor).toBe('#F5F5F1');
  });

  it('keeps mobile header gap stable', () => {
    expect(mobileHeaderHorizontalGap).toBe(10);
  });
});

