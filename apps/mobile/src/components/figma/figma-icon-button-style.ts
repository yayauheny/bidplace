import { designTokens } from '@bidplace/design-tokens';

export function figmaIconButtonStyle(pressed: boolean, surface: 'plain' | 'muted' = 'plain') {
  return {
    width: surface === 'muted' ? 42 : designTokens.size.iconButton,
    height: surface === 'muted' ? 42 : designTokens.size.iconButton,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: designTokens.radius.pill,
    backgroundColor: pressed
      ? designTokens.color.ghostHover
      : surface === 'muted' ? designTokens.color.headerControl : 'transparent',
  };
}

export const figmaIconButtonHitSlop =
  (designTokens.size.touch - designTokens.size.iconButton) / 2;
