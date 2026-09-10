import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { WorkCoverCard } from './WorkCoverCard';
import {
  RELATED_WORKS_TITLE,
  visibleRelatedWorks,
  type RelatedWorkItem,
} from './related-works';

export function RelatedWorksSection({
  items,
}: {
  items: readonly RelatedWorkItem[];
}) {
  const works = visibleRelatedWorks(items);
  if (works.length === 0) return null;

  return (
    <View style={{ gap: figmaTokens.space.sectionGap, width: '100%' }}>
      <Text
        style={[
          { color: figmaTokens.color.ink },
          figmaTokens.typography.label,
        ]}
      >
        {RELATED_WORKS_TITLE}
      </Text>
      <View style={{ gap: figmaTokens.space.sectionGap, width: '100%' }}>
        {works.map((item) => (
          <WorkCoverCard
            key={item.publicId}
            href={`/product/${item.publicId}`}
            imageUrl={item.imageUrl}
            imageLabel={item.title}
            title={item.title}
            authorSlug={item.authorSlug}
            mode="portfolio"
          />
        ))}
      </View>
    </View>
  );
}
