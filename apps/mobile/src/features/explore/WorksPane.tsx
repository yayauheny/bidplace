import { InfrastructureErrorState } from '../../components/shared/InfrastructureErrorState';
import type { PortfolioWorksRouteState } from '../products/portfolio-works-query';
import { View } from 'react-native';
import type { ReactNode } from 'react';

import { designTokens } from '@bidplace/design-tokens';

import { WorkCoverCardGrid } from '../../components/figma/WorkCoverCardGrid';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { useAppTheme } from '../../providers/theme-provider';
import { usePortfolioWorks } from '../products/use-portfolio-works';
import { SearchPaneStatus } from '../search/panes/search-pane-status';

export function WorksPane({
  state,
  controls,
}: {
  state: PortfolioWorksRouteState;
  controls?: ReactNode;
}) {
  const works = usePortfolioWorks(state);
  return (
    <SearchPaneStatus
      isPending={works.isPending}
      isError={works.isError && works.items.length === 0}
      onRetry={() => void works.refetch()}
      isEmpty={works.items.length === 0}
      controls={controls}
      keepControlsOnEmpty={Boolean(state.category || state.material)}
      loading={<WorksSkeleton />}
    >
      <View style={{ gap: designTokens.space.x3 }}>
        <WorkCoverCardGrid items={works.items} columns={2} variant="caption" />
        {works.isError ? (
          <InfrastructureErrorState
            presentation="inline"
            onRetry={() =>
              void (works.isFetchNextPageError
                ? works.fetchNextPage()
                : works.refetch())
            }
          />
        ) : null}
        {works.hasNextPage && !works.isFetchNextPageError ? (
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
      style={{ flexDirection: 'row', gap: designTokens.space.x2 }}
    >
      <SkeletonCover />
      <SkeletonCover />
    </View>
  );
}

function SkeletonCover() {
  const palette = useAppTheme();
  return (
    <View
      style={{
        flex: 1,
        aspectRatio:
          designTokens.size.coverWidth / designTokens.size.coverHeight,
        borderRadius: designTokens.radius.cover,
        backgroundColor: palette.surfaceMuted,
      }}
    />
  );
}
