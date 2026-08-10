import type { DimensionValue, ImageStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

export function productMediaStyle(width: DimensionValue = '100%'): ImageStyle {
  return {
    width,
    aspectRatio: designTokens.ratio.productPortrait,
    borderRadius: designTokens.radius.image,
    backgroundColor: designTokens.color.placeholder,
  };
}
