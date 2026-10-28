import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

/** Muted circular control from the story/header frames. */
export const figmaMutedIconButtonFrame = 42;

export function figmaIconButtonStyle(
  pressed: boolean,
  surface: 'plain' | 'muted' | 'outline' | 'destructive' = 'plain',
  palette: SemanticColorMap,
) {
  // Header action frame 4980:15197 is 38px including its inside stroke.
  return {
    width:
      surface === 'outline' || surface === 'destructive'
        ? 38
        : surface === 'muted'
          ? figmaMutedIconButtonFrame
          : designTokens.size.iconButton,
    height:
      surface === 'outline' || surface === 'destructive'
        ? 38
        : surface === 'muted'
          ? figmaMutedIconButtonFrame
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
    backgroundColor:
      surface === 'destructive'
        ? pressed
          ? palette.dangerHover
          : palette.destructiveFill
        : pressed
          ? palette.ghostHover
          : surface === 'muted'
            ? palette.headerControl
            : 'transparent',
  };
}

export const figmaIconButtonHitSlop =
  (designTokens.size.touch - designTokens.size.iconButton) / 2;
