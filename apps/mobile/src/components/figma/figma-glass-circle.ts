import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

import { webBackdropBlur } from './web-backdrop';

export function figmaGlassCircleStyle(palette: SemanticColorMap) {
  return {
    width: designTokens.size.social,
    height: designTokens.size.social,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: designTokens.radius.social,
    backgroundColor: palette.glassChip,
    borderWidth: 1,
    borderColor: palette.white,
    ...webBackdropBlur(designTokens.blur.dock),
  };
}
