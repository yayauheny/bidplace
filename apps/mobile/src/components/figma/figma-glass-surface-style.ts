import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

export const figmaGlassSurfacePresets = [
  'navigation',
  'controlGroup',
  'filterControl',
  'action',
] as const;

export type FigmaGlassSurfacePreset = (typeof figmaGlassSurfacePresets)[number];

export function figmaGlassSurfaceSpec(
  preset: FigmaGlassSurfacePreset,
  palette: SemanticColorMap,
) {
  const filterControl = preset === 'filterControl';
  const action = preset === 'action';
  const control = filterControl || action;
  return {
    blur: control ? designTokens.blur.control : designTokens.blur.dock,
    nativeIntensity: control
      ? designTokens.blur.controlNativeIntensity
      : designTokens.blur.dockNativeIntensity,
    borderWidth: 0.5,
    borderRadius: control
      ? designTokens.radius.filterSort
      : designTokens.radius.dock,
    background: action
      ? palette.actionGlass
      : filterControl
        ? palette.surface
        : preset === 'navigation'
          ? palette.glass
          : palette.glassStrong,
    borderStart: action
      ? palette.white
      : filterControl
        ? palette.toolbarBorder
        : palette.glassBorder,
    borderEnd: action
      ? palette.white
      : filterControl
        ? palette.toolbarBorder
        : palette.glassBorderEnd,
  } as const;
}
