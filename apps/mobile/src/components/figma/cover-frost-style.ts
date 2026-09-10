import { figmaTokens } from '@bidplace/design-tokens';

export type CoverFrostPlatform = 'native' | 'web';

export function coverFrostSpec(platform: CoverFrostPlatform) {
  return {
    sourceNodeIds: ['874:5459', '874:5474', '874:5543'],
    figmaProgressiveBlurRadius: 60,
    runtimeBlur: figmaTokens.blur.overlay,
    gradientStart: 'rgba(0, 0, 0, 0)',
    gradientEnd: figmaTokens.color.overlay,
    topRadius: figmaTokens.radius.overlay,
    contentPadding: figmaTokens.space.coverPad,
    contentGap: figmaTokens.space.coverGap,
    artworkAspectRatio:
      figmaTokens.size.coverWidth / figmaTokens.size.coverHeight,
    usesBackdropSampling: platform === 'web',
    usesDecorativeArtworkFallback: platform === 'native',
  } as const;
}
