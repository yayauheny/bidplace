import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

export function authorAtmosphereSpec(palette: SemanticColorMap) {
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
    wash: palette.atmosphereWash,
  } as const;
}
