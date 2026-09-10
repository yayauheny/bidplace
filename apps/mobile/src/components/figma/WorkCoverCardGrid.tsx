import { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

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
}: {
  items: WorkCoverCardGridItem[];
}) {
  return (
    <View style={{ gap: figmaTokens.space.sectionGap, width: '100%' }}>
      {items.map((item) => {
        const image = item.work.images[0];
        return (
          <WorkCoverCard
            key={item.work.publicId}
            href={`/product/${item.work.publicId}`}
            imageUrl={image?.url ?? ''}
            imageLabel={item.work.title}
            title={item.work.title}
            authorSlug={item.author.slug}
          />
        );
      })}
    </View>
  );
}
