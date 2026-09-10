import { describe, expect, it } from 'vitest';

import { coverFrostSpec } from './cover-frost-style';

describe('Cover frost', () => {
  it('matches the shared Figma overlay contract', () => {
    expect(coverFrostSpec('web')).toEqual({
      sourceNodeIds: ['874:5459', '874:5474', '874:5543'],
      figmaProgressiveBlurRadius: 60,
      runtimeBlur: 30,
      gradientStart: 'rgba(0, 0, 0, 0)',
      gradientEnd: 'rgba(41, 41, 41, 0.70)',
      topRadius: 12,
      contentPadding: 12,
      contentGap: 8,
      artworkAspectRatio: 0.75,
      usesBackdropSampling: true,
      usesDecorativeArtworkFallback: false,
    });
  });

  it('uses one decorative artwork fallback only on native', () => {
    expect(coverFrostSpec('native')).toMatchObject({
      usesBackdropSampling: false,
      usesDecorativeArtworkFallback: true,
    });
  });
});
