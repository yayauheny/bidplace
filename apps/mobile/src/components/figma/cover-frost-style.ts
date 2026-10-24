import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

export type CoverFrostPlacement = 'workBottom' | 'authorBottom' | 'authorTop';

// Figma 874:5474 / 874:5553 scrims; approved web approximation: Blur16 / Mask35.
export function coverFrostSpec(
  placement: CoverFrostPlacement,
  palette: SemanticColorMap,
) {
  const top = placement === 'authorTop';

  return {
    top,
    // The fully transparent gradient anchor is independent of the active theme.
    gradientStart: 'rgba(0, 0, 0, 0)',
    gradientEnd: top ? palette.overlayScrim : palette.overlay,
  };
}

export const coverFrostBackdropFilter = `blur(${designTokens.blur.cover}px) saturate(115%)`;

export const coverFrostMask =
  'linear-gradient(to bottom, transparent 0%, black 35%, black 100%)';
