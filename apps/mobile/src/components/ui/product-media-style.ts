import type { DimensionValue, ImageStyle } from 'react-native';

import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

export function productMediaStyle(
  width: DimensionValue = '100%',
  palette: SemanticColorMap,
): ImageStyle {
  return {
    width,
    aspectRatio: designTokens.ratio.productPortrait,
    borderRadius: designTokens.radius.image,
    backgroundColor: palette.placeholder,
  };
}
