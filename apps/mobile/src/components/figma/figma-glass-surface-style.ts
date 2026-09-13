import { figmaTokens } from '@bidplace/design-tokens';

export const figmaGlassSurfacePresets = [
  'navigation',
  'controlGroup',
  'filterControl',
] as const;

export type FigmaGlassSurfacePreset =
  (typeof figmaGlassSurfacePresets)[number];

export function figmaGlassSurfaceSpec(preset: FigmaGlassSurfacePreset) {
  const filterControl = preset === 'filterControl';
  return {
    blur: figmaTokens.blur.dock,
    nativeIntensity: figmaTokens.blur.dockNativeIntensity,
    borderWidth: 0.5,
    borderRadius: filterControl
      ? figmaTokens.radius.filterSort
      : figmaTokens.radius.dock,
    background:
      preset === 'navigation'
        ? figmaTokens.color.glass
        : figmaTokens.color.glassStrong,
    borderStart: filterControl
      ? figmaTokens.color.divider
      : figmaTokens.color.glassBorder,
    borderEnd: filterControl
      ? figmaTokens.color.divider
      : figmaTokens.color.glassBorderEnd,
  } as const;
}
