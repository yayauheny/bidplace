import { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { WorkCoverCardGrid } from '../../../components/figma/WorkCoverCardGrid';
import { usePortfolioWorks } from '../../products/use-portfolio-works';
import { SearchPaneStatus } from './search-pane-status';

export function WorksSearchPane({
  query,
  onSelect,
}: {
  query?: string;
  onSelect: () => void;
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
      <WorkCoverCardGrid
        items={works.items}
        columns={2}
        onItemPress={onSelect}
      />
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
