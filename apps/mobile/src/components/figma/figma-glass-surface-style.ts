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
    blur: filterControl ? designTokens.blur.control : designTokens.blur.dock,
    nativeIntensity: filterControl
      ? designTokens.blur.controlNativeIntensity
      : designTokens.blur.dockNativeIntensity,
    borderWidth: 0.5,
    borderRadius: filterControl
      ? designTokens.radius.filterSort
      : designTokens.radius.dock,
    background: filterControl
      ? palette.surface
      : preset === 'navigation'
        ? palette.glass
        : palette.glassStrong,
    borderStart: filterControl ? palette.toolbarBorder : palette.glassBorder,
    borderEnd: filterControl ? palette.toolbarBorder : palette.glassBorderEnd,
  } as const;
}
