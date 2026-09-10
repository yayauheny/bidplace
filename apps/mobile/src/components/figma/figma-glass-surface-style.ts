import { figmaTokens } from '@bidplace/design-tokens';

export const figmaGlassSurfacePresets = [
  'navigation',
  'controlGroup',
] as const;

export type FigmaGlassSurfacePreset =
  (typeof figmaGlassSurfacePresets)[number];

export function figmaGlassSurfaceSpec(preset: FigmaGlassSurfacePreset) {
  return {
    blur: figmaTokens.blur.dock,
    nativeIntensity: figmaTokens.blur.dockNativeIntensity,
    borderWidth: 0.5,
    borderRadius: figmaTokens.radius.dock,
    background:
      preset === 'navigation'
        ? figmaTokens.color.glass
        : figmaTokens.color.glassStrong,
    borderStart: figmaTokens.color.glassBorder,
    borderEnd: figmaTokens.color.glassBorderEnd,
  } as const;
}
