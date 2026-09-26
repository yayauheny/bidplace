import { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { WorkCoverCardGrid } from '../../../components/figma/WorkCoverCardGrid';
import { FigmaButton } from '../../../components/figma/FigmaButton';
import { usePortfolioWorks } from '../../products/use-portfolio-works';
import { SearchPaneStatus } from './search-pane-status';

export function WorksSearchPane({
  query,
}: {
  query?: string;
}) {
  const works = usePortfolioWorks(
    {
      ...(query ? { q: query } : {}),
      sort: 'newest',
    },
  );

  return (
    <SearchPaneStatus
      isPending={works.isPending}
      isError={works.isError}
      onRetry={() => void works.refetch()}
      isEmpty={Boolean(query) && works.items.length === 0}
      emptyTitle="Работы не найдены"
      loading={<WorksSkeleton />}
    >
      <View style={{ gap: figmaTokens.space.x3 }}>
        <WorkCoverCardGrid items={works.items} columns={2} />
        {works.hasNextPage ? (
          <FigmaButton
            label="Показать ещё"
            variant="outline"
            width="full"
            loading={works.isFetchingNextPage}
            onPress={() => void works.fetchNextPage()}
          />
        ) : null}
      </View>
    </SearchPaneStatus>
  );
}

function WorksSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      style={{ flexDirection: 'row', gap: figmaTokens.space.x2 }}
    >
      <SkeletonCover />
      <SkeletonCover />
    </View>
  );
}

function SkeletonCover() {
  return (
    <View
      style={{
        flex: 1,
        aspectRatio: figmaTokens.size.coverWidth / figmaTokens.size.coverHeight,
        borderRadius: figmaTokens.radius.cover,
        backgroundColor: figmaTokens.color.surfaceMuted,
      }}
    />
  );
}
