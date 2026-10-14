import { designTokens } from '@bidplace/design-tokens';

import { webBackdropBlur } from './web-backdrop';

export function figmaGlassCircleStyle() {
  return {
    width: designTokens.size.social,
    height: designTokens.size.social,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: designTokens.radius.social,
    backgroundColor: designTokens.color.glassChip,
    borderWidth: 1,
    borderColor: designTokens.color.white,
    ...webBackdropBlur(designTokens.blur.dock),
  };
}
