import { figmaTokens } from '@bidplace/design-tokens';

export type CoverFrostPlacement = 'workBottom' | 'authorBottom' | 'authorTop';

// The frost fills the overlay zone that hugs its text (Figma auto-layout:
// `874:5459` 125 with a two-line title and price, `745:20736` 102 with one
// line, `621:19888` 124 on the 366 card). It never scales with the card.
export function coverFrostSpec(placement: CoverFrostPlacement) {
  const top = placement === 'authorTop';

  return {
    top,
    runtimeBlur: top
      ? figmaTokens.blur.authorTopOverlay
      : figmaTokens.blur.overlay,
    gradientStart: 'rgba(0, 0, 0, 0)',
    gradientEnd: top
      ? figmaTokens.color.overlayScrim
      : figmaTokens.color.overlay,
    artworkAspectRatio:
      figmaTokens.size.coverWidth / figmaTokens.size.coverHeight,
  };
}

export function coverFrostBlur(runtimeBlur: number) {
  return `blur(${runtimeBlur}px)`;
}

// One ramp: Figma 0→radius along the overlay. Stacked bands read as stripes.
export function coverFrostBlurMask(top: boolean) {
  return `linear-gradient(to ${top ? 'top' : 'bottom'}, transparent, black)`;
}
