import { designTokens } from '@bidplace/design-tokens';

export function workGalleryShowsArrows(layoutWidth: number) {
  return layoutWidth > designTokens.layout.phoneWidth;
}
