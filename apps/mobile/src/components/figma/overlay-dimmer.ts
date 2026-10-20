import type { SemanticColorMap } from '@bidplace/design-tokens';

export function overlayDimmerStyle(palette: SemanticColorMap) {
  return {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: palette.modalDimmer,
  };
}
