import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AuthorCoverCard } from '../figma/AuthorCoverCard';

export type CreatorCardItem = {
  sellerProfile: {
    slug: string;
    fullName: string;
    profilePhotoUrl: string;
    discipline?: string | null;
  };
};

export function CreatorCard({ item }: { item: CreatorCardItem }) {
  const tags = item.sellerProfile.discipline
    ? item.sellerProfile.discipline.split(',').map((tag) => tag.trim())
    : [];
  return (
    <AuthorCoverCard
      fullName={item.sellerProfile.fullName}
      slug={item.sellerProfile.slug}
      tags={tags}
      imageUrl={item.sellerProfile.profilePhotoUrl}
    />
  );
}

export function CreatorCardGrid({
  items,
}: {
  items: CreatorCardItem[];
  columns?: number;
}) {
  return (
    <View style={{ gap: designTokens.space.sectionGap, width: '100%' }}>
      {items.map((item) => (
        <CreatorCard key={item.sellerProfile.slug} item={item} />
      ))}
    </View>
  );
}
