import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

export const figmaGlassSurfacePresets = [
  'navigation',
  'controlGroup',
  'filterControl',
] as const;

export type FigmaGlassSurfacePreset = (typeof figmaGlassSurfacePresets)[number];

export function figmaGlassSurfaceSpec(
  preset: FigmaGlassSurfacePreset,
  palette: SemanticColorMap,
) {
  const filterControl = preset === 'filterControl';
  return {
    blur: designTokens.blur.dock,
    nativeIntensity: designTokens.blur.dockNativeIntensity,
    borderWidth: 0.5,
    borderRadius: filterControl
      ? designTokens.radius.filterSort
      : designTokens.radius.dock,
    background: preset === 'navigation' ? palette.glass : palette.glassStrong,
    borderStart: filterControl ? palette.divider : palette.glassBorder,
    borderEnd: filterControl ? palette.divider : palette.glassBorderEnd,
  } as const;
}
