import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

export function figmaIconButtonStyle(
  pressed: boolean,
  surface: 'plain' | 'muted' = 'plain',
  palette: SemanticColorMap,
) {
  return {
    width: surface === 'muted' ? 42 : designTokens.size.iconButton,
    height: surface === 'muted' ? 42 : designTokens.size.iconButton,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
