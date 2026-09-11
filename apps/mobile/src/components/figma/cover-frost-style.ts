import { figmaTokens } from '@bidplace/design-tokens';

export type CoverFrostPlacement = 'workBottom' | 'authorBottom' | 'authorTop';

export function coverFrostSpec(placement: CoverFrostPlacement) {
  const top = placement === 'authorTop';
  const height = top
    ? figmaTokens.size.authorTopFrostHeight
    : placement === 'workBottom'
      ? figmaTokens.size.workFrostHeight
      : figmaTokens.size.authorBottomFrostHeight;

  return {
    top,
    heightPercent: (height / figmaTokens.size.coverHeight) * 100,
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
