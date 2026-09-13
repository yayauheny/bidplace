import { figmaTokens } from '@bidplace/design-tokens';

export function authorAtmosphereSpec() {
  return {
    sourceNodeId: '621:19476',
    width: figmaTokens.size.authorAtmosphere,
    height: figmaTokens.size.authorAtmosphere,
    left: -47,
    top: -figmaTokens.space.atmosphereOffset,
    opacity: figmaTokens.opacity.atmosphere,
    blur: figmaTokens.blur.atmosphere,
    bottomRadius: 200,
    wash: figmaTokens.color.atmosphereWash,
  } as const;
}
