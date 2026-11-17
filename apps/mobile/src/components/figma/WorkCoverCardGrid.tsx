import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { PaddedGrid } from './PaddedGrid';
import { WorkCoverCard } from './WorkCoverCard';

export type WorkCoverCardGridType = {
  items: WorkCoverCardGridItem[];
  columns?: 1 | 2;
  variant?: 'overlay' | 'caption';
  onItemPress?: () => void;
  blurImage?: boolean;
};

export type WorkCoverCardGridItem = {
  work: {
    publicId: string;
    title: string;
    images: Array<{
      url: string;
      crop?: import('@bidplace/contracts').PhotoCrop | null;
      width?: number | null;
      height?: number | null;
    }>;
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
  blurImage = false,
}: WorkCoverCardGridType) {
  if (columns === 1) {
    return (
      <View style={{ width: '100%', gap: designTokens.space.sectionGap }}>
        {items.map((item) => (
          <WorkCoverGridCard
            key={item.work.publicId}
            item={item}
            onItemPress={onItemPress}
            variant={variant}
            blurImage = {blurImage}
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
            blurImage = {blurImage}
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
  blurImage,
}: {
  item: WorkCoverCardGridItem;
  variant: 'overlay' | 'caption';
  onItemPress?: () => void;
  blurImage?: boolean;
}) {
  const image = item.work.images[0];
  return (
    <WorkCoverCard
      variant={variant}
      href={`/product/${item.work.publicId}`}
      imageUrl={image?.url ?? ''}
      imagePresentation={image}
      imageLabel={item.work.title}
      title={item.work.title}
      authorSlug={item.author.slug}
      onPress={onItemPress}
      blurImage={blurImage}
    />
  );
}
