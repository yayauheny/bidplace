import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

export function CatalogCardSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      style={{
        width: '100%',
        height: designTokens.size.listCoverHeight,
        overflow: 'hidden',
        borderRadius: designTokens.radius.card,
        backgroundColor: designTokens.color.surfaceMuted,
      }}
    />
  );
}
