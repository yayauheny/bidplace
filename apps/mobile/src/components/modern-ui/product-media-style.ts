import type { DimensionValue, ImageStyle } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

export function productMediaStyle(width: DimensionValue = '100%'): ImageStyle {
  return {
    width,
    aspectRatio: modernTokens.ratio.productPortrait,
    borderRadius: modernTokens.radius.image,
    backgroundColor: modernTokens.color.placeholder,
  };
}
