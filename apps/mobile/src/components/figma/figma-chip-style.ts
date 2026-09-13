import { figmaTokens } from '@bidplace/design-tokens';

export type FigmaChipTone = 'onLight' | 'onDark' | 'onGlass';
export type FigmaChipSize = 'compact' | 'profile' | 'work';

export function figmaChipStyle(tone: FigmaChipTone = 'onLight') {
  if (tone === 'onGlass') {
    return {
      paddingHorizontal: figmaTokens.space.chipX,
      paddingVertical: figmaTokens.space.chipY,
      borderRadius: figmaTokens.radius.chip,
      backgroundColor: figmaTokens.color.glassStrong,
      borderWidth: 1,
      borderColor: figmaTokens.color.glassBorder,
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

export function figmaChipSizeStyle(size: FigmaChipSize) {
  if (size === 'profile') {
    return {
      paddingHorizontal: figmaTokens.space.authorChipX,
      paddingVertical: figmaTokens.space.authorChipY,
    };
  }
  if (size === 'work') {
    return {
      paddingHorizontal: figmaTokens.space.workChipX,
      paddingVertical: figmaTokens.space.workChipY,
    };
  }
  return {};
}

export function figmaChipTypography(size: FigmaChipSize) {
  if (size === 'profile') return figmaTokens.typography.profileChip;
  if (size === 'work') return figmaTokens.typography.workChip;
  return figmaTokens.typography.chip;
}

export function figmaChipTextColor(
  tone: FigmaChipTone,
  size: FigmaChipSize = 'compact',
) {
  if (tone === 'onDark') return figmaTokens.color.white;
  if (size === 'work') return figmaTokens.color.textSubdued;
  return figmaTokens.color.ink;
}
