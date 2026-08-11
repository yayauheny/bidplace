import type { PublicSellerListItem } from '@bidplace/contracts';
import { View, type DimensionValue } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { CreatorCard } from './CreatorCard';

export function CreatorCardGrid({
  columns,
  items,
}: {
  columns: 1 | 2 | 3 | 4;
  items: PublicSellerListItem[];
}) {
  const width = `${(100 / columns).toFixed(4)}%` as DimensionValue;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        margin: -designTokens.space.x2,
      }}
    >
      {items.map((item) => (
        <View
          key={item.sellerProfile.slug}
          style={{ width, padding: designTokens.space.x2 }}
        >
          <CreatorCard item={item} />
        </View>
      ))}
    </View>
  );
}
