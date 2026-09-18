import { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { usePortfolioAuthors } from '../../sellers/use-portfolio-authors';
import { AuthorSearchRow } from '../AuthorSearchRow';
import { SearchPaneStatus } from './search-pane-status';

export function AuthorsSearchPane({
  query,
  onSelect,
}: {
  query?: string;
  onSelect: () => void;
}) {
  const authors = usePortfolioAuthors(
    {
      ...(query ? { q: query } : {}),
      sort: 'added',
    },
  );

  return (
    <SearchPaneStatus
      isPending={authors.isPending}
      isError={authors.isError}
      onRetry={() => void authors.refetch()}
      isEmpty={Boolean(query) && authors.items.length === 0}
      emptyTitle="Авторы не найдены"
      loading={<AuthorSkeleton />}
    >
      <View style={{ width: '100%', gap: figmaTokens.space.identityGap }}>
        {authors.items.map((item) => (
          <AuthorSearchRow
            key={item.author.slug}
            slug={item.author.slug}
            profilePhotoUrl={item.author.profilePhotoUrl}
            shortDescription={item.author.shortDescription}
            onPress={onSelect}
          />
        ))}
      </View>
    </SearchPaneStatus>
  );
}

function AuthorSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      style={{ gap: figmaTokens.space.identityGap }}
    >
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </View>
  );
}

function SkeletonRow() {
  return (
    <View
      style={{
        height: figmaTokens.size.touch,
        borderRadius: figmaTokens.radius.small,
        backgroundColor: figmaTokens.color.surfaceMuted,
      }}
    />
  );
}
