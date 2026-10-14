import { designTokens } from '@bidplace/design-tokens';

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
    blur: designTokens.blur.dock,
    nativeIntensity: designTokens.blur.dockNativeIntensity,
    borderWidth: 0.5,
    borderRadius: filterControl
      ? designTokens.radius.filterSort
      : designTokens.radius.dock,
    background:
      preset === 'navigation'
        ? designTokens.color.glass
        : designTokens.color.glassStrong,
    borderStart: filterControl
      ? designTokens.color.divider
      : designTokens.color.glassBorder,
    borderEnd: filterControl
      ? designTokens.color.divider
      : designTokens.color.glassBorderEnd,
  } as const;
}
