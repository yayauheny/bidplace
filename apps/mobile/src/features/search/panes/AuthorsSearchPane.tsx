import { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { usePortfolioAuthors } from '../../sellers/use-portfolio-authors';
import { AuthorSearchRow } from '../AuthorSearchRow';
import { FigmaButton } from '../../../components/figma/FigmaButton';
import { SearchPaneStatus } from './search-pane-status';
import { searchPaginationView } from './search-pagination';

export function AuthorsSearchPane({
  query,
}: {
  query?: string;
}) {
  const authors = usePortfolioAuthors(
    {
      ...(query ? { q: query } : {}),
      sort: 'added',
    },
  );
  const pagination = searchPaginationView(authors);

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
        {pagination.items.map((item) => (
          <AuthorSearchRow
            key={item.author.slug}
            slug={item.author.slug}
            profilePhotoUrl={item.author.profilePhotoUrl}
            shortDescription={item.author.shortDescription}
          />
        ))}
        {pagination.nextPage ? (
          <FigmaButton
            label={pagination.nextPage.label}
            variant="outline"
            width="full"
            loading={pagination.nextPage.loading}
            onPress={() => void authors.fetchNextPage()}
          />
        ) : null}
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
