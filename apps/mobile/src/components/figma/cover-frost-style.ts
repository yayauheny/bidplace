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

// Gradually add blur toward the edge without revealing sharp pixels below it.
export const coverFrostLevels = [1 / 32, 1 / 16, 1 / 8, 1 / 4, 1 / 2, 1];

export function coverFrostMask(index: number, top: boolean) {
  const level = coverFrostLevels[index];
  const previous = coverFrostLevels[index - 1] ?? 0;
  return `linear-gradient(to ${top ? 'top' : 'bottom'}, transparent ${previous * 100}%, black ${level * 100}%)`;
}
