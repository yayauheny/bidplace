import { figmaTokens } from '@bidplace/design-tokens';

// `tinted`: the cover chip fill with ink text on a light surface (`874:5596`).
export type FigmaChipTone = 'onLight' | 'onDark' | 'onGlass' | 'tinted';
export type FigmaChipSize = 'compact' | 'profile' | 'work';

export const figmaChipGradientStroke = {
  start: 'rgba(255, 255, 255, 0.16)',
  end: 'rgba(153, 153, 153, 0.16)',
} as const;

export function figmaChipUsesGradientStroke(tone: FigmaChipTone) {
  return tone === 'onDark' || tone === 'tinted' || tone === 'onGlass';
}

export function figmaChipGradientPlacement(tone: FigmaChipTone) {
  if (tone === 'onGlass') return 'outside' as const;
  if (figmaChipUsesGradientStroke(tone)) return 'inset' as const;
  return 'none' as const;
}

export function figmaChipGradientColors(tone: FigmaChipTone) {
  if (tone === 'onGlass') {
    return {
      start: figmaTokens.color.glassBorder,
      end: figmaTokens.color.glassBorderEnd,
    } as const;
  }
  return figmaChipGradientStroke;
}

const contentBoxExcludeMask =
  'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)';

type GradientRingStyle = {
  position: 'absolute';
  top: number;
  right: number;
  bottom: number;
  left: number;
  padding: number;
  borderRadius: number;
  pointerEvents: 'none';
  boxSizing: 'border-box';
  backgroundImage: string;
  WebkitMask: string;
  WebkitMaskComposite: string;
  mask: string;
  maskComposite: string;
};

// 1px outside ring for translucent `onGlass` fill. A filled behind-plate
// would show through `rgba(255,255,255,0.80)`.
export function figmaChipOutsideGradientRingStyle(colors: {
  start: string;
  end: string;
}): GradientRingStyle {
  return {
    position: 'absolute',
    top: -1,
    right: -1,
    bottom: -1,
    left: -1,
    padding: 1,
    borderRadius: figmaTokens.radius.chip + 1,
    pointerEvents: 'none',
    boxSizing: 'border-box',
    backgroundImage: `linear-gradient(180deg, ${colors.start}, ${colors.end})`,
    WebkitMask: contentBoxExcludeMask,
    WebkitMaskComposite: 'xor',
    mask: contentBoxExcludeMask,
    maskComposite: 'exclude',
  };
}

export function figmaChipLayoutHeight(size: FigmaChipSize) {
  const typography = figmaChipTypography(size);
  if (size === 'profile') {
    return figmaTokens.space.authorChipY * 2 + typography.lineHeight;
  }
  if (size === 'work') {
    return figmaTokens.space.workChipY * 2 + typography.lineHeight;
  }
  return figmaTokens.space.chipY * 2 + typography.lineHeight;
}

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

  if (tone === 'onDark' || tone === 'tinted') {
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
