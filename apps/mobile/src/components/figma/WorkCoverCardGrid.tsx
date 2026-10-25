import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { PaddedGrid } from './PaddedGrid';
import { WorkCoverCard } from './WorkCoverCard';

export type WorkCoverCardGridItem = {
  work: {
    publicId: string;
    title: string;
    images: Array<{ url: string }>;
  };
  author: {
    slug: string;
  };
};

export function WorkCoverCardGrid({
  items,
  columns = 1,
  onItemPress,
  variant = 'overlay',
}: {
  items: WorkCoverCardGridItem[];
  columns?: 1 | 2;
  variant?: 'overlay' | 'caption';
  onItemPress?: () => void;
}) {
  if (columns === 1) {
    return (
      <View style={{ width: '100%', gap: designTokens.space.sectionGap }}>
        {items.map((item) => (
          <WorkCoverGridCard
            key={item.work.publicId}
            item={item}
            onItemPress={onItemPress}
            variant={variant}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={{ width: '100%', gap: designTokens.space.x2 }}>
      <PaddedGrid
        items={items}
        columns={columns}
        gap={designTokens.space.x2}
        keyExtractor={(item) => item.work.publicId}
        renderItem={(item) => (
          <WorkCoverGridCard
            item={item}
            onItemPress={onItemPress}
            variant={variant}
          />
        )}
      />
    </View>
  );
}

function WorkCoverGridCard({
  item,
  onItemPress,
  variant,
}: {
  item: WorkCoverCardGridItem;
  variant: 'overlay' | 'caption';
  onItemPress?: () => void;
}) {
  const image = item.work.images[0];
  return (
    <WorkCoverCard
      variant={variant}
      href={`/product/${item.work.publicId}`}
      imageUrl={image?.url ?? ''}
      imageLabel={item.work.title}
      title={item.work.title}
      authorSlug={item.author.slug}
      onPress={onItemPress}
    />
  );
}
