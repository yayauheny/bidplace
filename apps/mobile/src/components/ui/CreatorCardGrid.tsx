import { View, type DimensionValue } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { CreatorCard, type CreatorCardItem } from './CreatorCard';

export function CreatorCardGrid({
  columns,
  items,
}: {
  columns: 1 | 2 | 3 | 4;
  items: CreatorCardItem[];
}) {
  const width = `${(100 / columns).toFixed(4)}%` as DimensionValue;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        margin: -designTokens.space.x3,
      }}
    >
      {items.map((item) => (
        <View
          key={item.sellerProfile.slug}
          style={{ width, padding: designTokens.space.x3 }}
        >
          <CreatorCard item={item} />
        </View>
      ))}
    </View>
  );
}
