import type { ReactNode } from 'react';

import { View, type DimensionValue } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

export type CatalogColumnCount = 1 | 2 | 3 | 4;

export function CatalogGrid({
  columns,
  count,
  renderCard,
}: {
  columns: CatalogColumnCount;
  count: number;
  renderCard: (index: number) => ReactNode;
}) {
  const cardWidth = `${(100 / columns).toFixed(4)}%` as DimensionValue;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        margin: -designTokens.space.x3,
      }}
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{ width: cardWidth, padding: designTokens.space.x3 }}
        >
          {renderCard(index)}
        </View>
      ))}
    </View>
  );
}

