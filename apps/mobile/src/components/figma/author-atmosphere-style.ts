import { figmaTokens } from '@bidplace/design-tokens';

export function authorAtmosphereSpec() {
  const width = figmaTokens.size.authorAtmosphere;
  return {
    sourceNodeId: '621:19476',
    width,
    height: figmaTokens.size.authorAtmosphere,
    left: -47,
    top: -figmaTokens.space.atmosphereOffset,
    opacity: figmaTokens.opacity.atmosphere,
    blur: 80,
    maskFade: 80,
    bottomRadius: 200,
    wash: figmaTokens.color.atmosphereWash,
    webLeft: `calc(50% - max(${width}px, 100vw) / 2)`,
    webWidth: `max(${width}px, 100vw)`,
  } as const;
}
