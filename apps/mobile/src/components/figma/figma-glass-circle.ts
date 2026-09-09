import { figmaTokens } from '@bidplace/design-tokens';

import { webBackdropBlur } from './web-backdrop';

export function figmaGlassCircleStyle() {
  return {
    width: figmaTokens.size.social,
    height: figmaTokens.size.social,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: figmaTokens.radius.social,
    backgroundColor: figmaTokens.color.glassChip,
    borderWidth: 1,
    borderColor: figmaTokens.color.white,
    ...webBackdropBlur(figmaTokens.blur.dock),
  };
}
