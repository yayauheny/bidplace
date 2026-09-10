import { figmaTokens } from '@bidplace/design-tokens';

export function figmaIconButtonStyle(pressed: boolean) {
  return {
    width: figmaTokens.size.iconButton,
    height: figmaTokens.size.iconButton,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: figmaTokens.radius.pill,
    backgroundColor: pressed ? figmaTokens.color.ghostHover : 'transparent',
  };
}

export const figmaIconButtonHitSlop =
  (figmaTokens.size.touch - figmaTokens.size.iconButton) / 2;
