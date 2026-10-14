import { designTokens } from '@bidplace/design-tokens';

export function authorAtmosphereSpec() {
  return {
    sourceNodeId: '621:19476',
    width: designTokens.size.authorAtmosphere,
    height: designTokens.size.authorAtmosphere,
    left: -47,
    top: -designTokens.space.atmosphereOffset,
    opacity: designTokens.opacity.atmosphere,
    blur: 80,
    maskFade: 80,
    bottomRadius: 200,
    wash: designTokens.color.atmosphereWash,
  } as const;
}
