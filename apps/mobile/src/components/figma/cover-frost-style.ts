import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

export type CoverFrostPlacement = 'workBottom' | 'authorBottom' | 'authorTop';

// Figma874:5474/5555: bottom blur30;874:5553: top scrim without blur.
export function coverFrostSpec(
  placement: CoverFrostPlacement,
  palette: SemanticColorMap,
) {
  const top = placement === 'authorTop';

  return {
    top,
    runtimeBlur: top
      ? designTokens.blur.authorTopOverlay
      : designTokens.blur.overlay,
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
