import { designTokens } from '@bidplace/design-tokens';

/**
 * Frame 76 (`745:21332`) is 350×48 at x=20, y=62 on a 390 frame whose
 * hero starts at y=50 (iOS status bar). Web has no status bar, so the
 * overlay sits 12px from the hero top.
 */
export function workGalleryChromeStyle() {
  return {
    position: 'absolute' as const,
    top: designTokens.space.x3,
    left: designTokens.space.x5,
    right: designTokens.space.x5,
    height: designTokens.size.header,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    pointerEvents: 'box-none' as const,
  };
}

export function workGalleryDotColor(active: boolean) {
  return active ? designTokens.color.ink : designTokens.color.border;
}

export function workGalleryDotStyle(active: boolean) {
  const size = designTokens.size.statusDot;
  return {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: workGalleryDotColor(active),
  };
}
