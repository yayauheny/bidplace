import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { Skeleton } from '../../components/ui';

export function CatalogCardSkeleton() {
  return (
    <View
      style={{
        overflow: 'hidden',
        borderRadius: designTokens.radius.card,
        backgroundColor: designTokens.color.surfaceMuted,
      }}
    >
      <Skeleton style={{ width: '100%', aspectRatio: 1, borderRadius: 0 }} />
      <View
        style={{
          minHeight: 134,
          gap: designTokens.space.x2,
          padding: designTokens.space.x4,
        }}
      >
        <Skeleton style={{ width: '78%', height: 23 }} />
        <Skeleton style={{ width: '48%', height: 20 }} />
        <View style={{ flex: 1 }} />
        <Skeleton style={{ width: '100%', height: 40 }} />
      </View>
    </View>
  );
}

