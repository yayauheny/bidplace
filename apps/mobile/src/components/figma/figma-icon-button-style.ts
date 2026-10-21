import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

export function figmaIconButtonStyle(
  pressed: boolean,
  surface: 'plain' | 'muted' | 'outline' = 'plain',
  palette: SemanticColorMap,
) {
  // Header action frame 4980:15197 is 38px including its inside stroke.
  return {
    width:
      surface === 'outline'
        ? 38
        : surface === 'muted'
          ? 42
          : designTokens.size.iconButton,
    height:
      surface === 'outline'
        ? 38
        : surface === 'muted'
          ? 42
          : designTokens.size.iconButton,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...(surface === 'outline'
      ? {
          borderWidth: designTokens.size.fieldBorder,
          borderColor: palette.border,
        }
      : {}),
    borderRadius: designTokens.radius.pill,
    backgroundColor: pressed
      ? palette.ghostHover
      : surface === 'muted'
        ? palette.headerControl
        : 'transparent',
  };
}

export const figmaIconButtonHitSlop =
  (designTokens.size.touch - designTokens.size.iconButton) / 2;
