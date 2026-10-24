import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

export type CoverFrostPlacement = 'workBottom' | 'authorBottom' | 'authorTop';

// Figma 874:5474: progressive bottom blur, radius 60; 874:5553: top scrim without blur.
export function coverFrostSpec(
  placement: CoverFrostPlacement,
  palette: SemanticColorMap,
) {
  const top = placement === 'authorTop';

  return {
    top,
    runtimeBlur: top
      ? designTokens.blur.authorTopOverlay
      : designTokens.blur.coverProgressive,
    // The fully transparent gradient anchor is independent of the active theme.
    gradientStart: 'rgba(0, 0, 0, 0)',
    gradientEnd: top ? palette.overlayScrim : palette.overlay,
    artworkAspectRatio:
      designTokens.size.coverWidth / designTokens.size.coverHeight,
  };
}

export function coverFrostBlur(runtimeBlur: number) {
  return `blur(${runtimeBlur}px)`;
}

export const coverFrostProgressiveMask =
  'linear-gradient(to bottom, transparent 0%, black 100%)';
