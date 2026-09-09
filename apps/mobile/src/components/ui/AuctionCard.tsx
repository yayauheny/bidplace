import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { WorkCoverCard } from '../figma/WorkCoverCard';
import { type AuctionCardItem } from './auction-card-item';

export function AuctionCard({ item }: { item: AuctionCardItem }) {
  const image = item.product.images[0];
  return (
    <WorkCoverCard
      href={`/product/${item.product.publicId}`}
      imageUrl={image?.url ?? ''}
      imageLabel={item.product.title}
      title={item.product.title}
      authorSlug={item.sellerProfile.slug}
      mode="portfolio"
    />
  );
}

export function AuctionCardGrid({
  items,
}: {
  items: AuctionCardItem[];
  columns?: number;
}) {
  return (
    <View style={{ gap: designTokens.space.sectionGap, width: '100%' }}>
      {items.map((item) => (
        <AuctionCard key={item.product.publicId} item={item} />
      ))}
    </View>
  );
}
