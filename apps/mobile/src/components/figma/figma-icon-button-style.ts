import { designTokens, figmaTokens } from '@bidplace/design-tokens';

export function figmaIconButtonStyle(pressed: boolean, surface: 'plain' | 'muted' = 'plain') {
  return {
    width: surface === 'muted' ? 42 : figmaTokens.size.iconButton,
    height: surface === 'muted' ? 42 : figmaTokens.size.iconButton,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: figmaTokens.radius.pill,
    backgroundColor: pressed
      ? figmaTokens.color.ghostHover
      : surface === 'muted' ? designTokens.color.headerControl : 'transparent',
  };
}

export const figmaIconButtonHitSlop =
  (figmaTokens.size.touch - figmaTokens.size.iconButton) / 2;
