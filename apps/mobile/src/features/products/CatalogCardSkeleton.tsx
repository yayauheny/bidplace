import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { useAppTheme } from '../../providers/theme-provider';

export function CatalogCardSkeleton() {
  const palette = useAppTheme();
  return (
    <View
      accessibilityRole="progressbar"
      style={{
        width: '100%',
        height: designTokens.size.listCoverHeight,
        overflow: 'hidden',
        borderRadius: designTokens.radius.card,
        backgroundColor: palette.surfaceMuted,
      }}
    />
  );
}
