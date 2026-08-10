import { View, type DimensionValue } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AuctionCard } from './AuctionCard';

export function AuctionCardGrid({
  columns,
  items,
}: {
  columns: 1 | 2 | 3 | 4;
  items: React.ComponentProps<typeof AuctionCard>['item'][];
}) {
  const cardWidth = `${(100 / columns).toFixed(4)}%` as DimensionValue;

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
          key={item.product.id}
          style={{ width: cardWidth, padding: designTokens.space.x2 }}
        >
          <AuctionCard item={item} />
        </View>
      ))}
    </View>
  );
}
