import { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { paddedGridRows } from './flex-grid-rows';
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
}: {
  items: WorkCoverCardGridItem[];
  columns?: 1 | 2;
  onItemPress?: () => void;
}) {
  if (columns === 1) {
    return (
      <View style={{ width: '100%', gap: figmaTokens.space.sectionGap }}>
        {items.map((item) => (
          <WorkCoverGridCard
            key={item.work.publicId}
            item={item}
            onItemPress={onItemPress}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={{ width: '100%', gap: figmaTokens.space.x2 }}>
      {paddedGridRows(items, columns).map((row, rowIndex) => (
        <View
          key={row.find((item) => item)?.work.publicId ?? `row-${rowIndex}`}
          style={{ flexDirection: 'row', gap: figmaTokens.space.x2 }}
        >
          {row.map((item, cellIndex) => (
            <View
              key={item?.work.publicId ?? `spacer-${rowIndex}-${cellIndex}`}
              style={{ flex: 1, minWidth: 0 }}
            >
              {item ? (
                <WorkCoverGridCard item={item} onItemPress={onItemPress} />
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function WorkCoverGridCard({
  item,
  onItemPress,
}: {
  item: WorkCoverCardGridItem;
  onItemPress?: () => void;
}) {
  const image = item.work.images[0];
  return (
    <WorkCoverCard
      href={`/product/${item.work.publicId}`}
      imageUrl={image?.url ?? ''}
      imageLabel={item.work.title}
      title={item.work.title}
      authorSlug={item.author.slug}
      onPress={onItemPress}
    />
  );
}
