import { figmaTokens } from '@bidplace/design-tokens';

export type FigmaChipTone = 'onLight' | 'onDark' | 'onGlass';

export function figmaChipStyle(tone: FigmaChipTone = 'onLight') {
  if (tone === 'onGlass') {
    return {
      paddingHorizontal: figmaTokens.space.chipX,
      paddingVertical: figmaTokens.space.chipY,
      borderRadius: figmaTokens.radius.chip,
      backgroundColor: figmaTokens.color.glassChip,
      borderWidth: 1,
      borderColor: figmaTokens.color.white,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    };
  }

  if (tone === 'onDark') {
    return {
      paddingHorizontal: figmaTokens.space.chipX,
      paddingVertical: figmaTokens.space.chipY,
      borderRadius: figmaTokens.radius.chip,
      backgroundColor: figmaTokens.color.chip,
      borderWidth: 1,
      borderColor: figmaTokens.color.chipOutline,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    };
  }

  return {
    paddingHorizontal: figmaTokens.space.chipX,
    paddingVertical: figmaTokens.space.chipY,
    borderRadius: figmaTokens.radius.chip,
    backgroundColor: figmaTokens.color.mutedFill,
    borderWidth: 1,
    borderColor: figmaTokens.color.border,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  };
}

export function figmaChipTextColor(tone: FigmaChipTone) {
  return tone === 'onDark' ? figmaTokens.color.white : figmaTokens.color.ink;
}
