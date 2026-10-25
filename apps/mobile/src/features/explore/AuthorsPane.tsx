import { InfrastructureErrorState } from '../../components/shared/InfrastructureErrorState';
import type { PortfolioAuthorsRouteState } from '../sellers/portfolio-authors-query';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { useAppTheme } from '../../providers/theme-provider';
import { usePortfolioAuthors } from '../sellers/use-portfolio-authors';
import { AuthorSearchRow } from '../search/AuthorSearchRow';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { SearchPaneStatus } from '../search/panes/search-pane-status';

export function AuthorsPane({ state }: { state: PortfolioAuthorsRouteState }) {
  const authors = usePortfolioAuthors(state);
  const query = state.q;
  return (
    <SearchPaneStatus
      isPending={authors.isPending}
      isError={authors.isError && authors.items.length === 0}
      onRetry={() => void authors.refetch()}
      isEmpty={authors.items.length === 0}
      emptyTitle={query ? 'Авторы не найдены' : 'Пока нет авторов'}
      loading={<AuthorSkeleton />}
    >
      <View style={{ width: '100%', gap: designTokens.space.identityGap }}>
        {authors.items.map((item) => (
          <AuthorSearchRow
            key={item.author.slug}
            slug={item.author.slug}
            profilePhotoUrl={item.author.profilePhotoUrl}
            shortDescription={item.author.shortDescription}
          />
        ))}
        {authors.isError ? (
          <InfrastructureErrorState
            presentation="inline"
            onRetry={() =>
              void (authors.isFetchNextPageError
                ? authors.fetchNextPage()
                : authors.refetch())
            }
          />
        ) : null}
        {authors.hasNextPage && !authors.isFetchNextPageError ? (
          <FigmaButton
            label="Показать ещё"
            variant="outline"
            width="full"
            loading={authors.isFetchingNextPage}
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
      style={{ gap: designTokens.space.identityGap }}
    >
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </View>
  );
}

function SkeletonRow() {
  const palette = useAppTheme();
  return (
    <View
      style={{
        height: designTokens.size.touch,
        borderRadius: designTokens.radius.small,
        backgroundColor: palette.surfaceMuted,
      }}
    />
  );
}
