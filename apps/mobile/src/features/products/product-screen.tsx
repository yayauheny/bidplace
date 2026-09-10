import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { View, ScrollView } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaButton } from '../../components/figma/FigmaButton';
import { PaymentDeliveryStub } from '../../components/figma/PaymentDeliveryStub';
import { RelatedWorksSection } from '../../components/figma/RelatedWorksSection';
import { ShareSheet } from '../../components/figma/ShareSheet';
import { WorkContentTabs } from '../../components/figma/WorkContentTabs';
import { WorkFactsList } from '../../components/figma/WorkFactsList';
import { WorkGallery } from '../../components/figma/WorkGallery';
import { WorkIdentityBlock } from '../../components/figma/WorkIdentityBlock';
import { WorkStory } from '../../components/figma/WorkStory';
import {
  resolveWorkContentTab,
  type WorkContentTabId,
} from '../../components/figma/work-content-tabs';
import { visibleWorkStory } from '../../components/figma/work-story';
import { AppShell } from '../../components/layout';
import { PageState } from '../../components/ui';
import { publicShareUrl } from '../../lib/public-share-url';
import { useTrackListingView } from '../../lib/analytics/use-track-views';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { useApiClient } from '../../providers/api-provider';
import { relatedWorksExcludingCurrent } from './work-screen-composition';

export function ProductScreen({
  publicId,
  activeTab = 'details',
  onTabChange,
}: {
  publicId: string;
  activeTab?: WorkContentTabId;
  onTabChange?: (tab: WorkContentTabId) => void;
}) {
  const api = useApiClient();
  const [shareOpen, setShareOpen] = useState(false);
  const query = useQuery({
    queryKey: ['portfolio-work', publicId],
    queryFn: () => api.portfolio.getWork(publicId),
    retry: retryTransientPublicQuery,
  });

  useTrackListingView({
    productPublicId: publicId,
    sellerProfileId: query.data?.author.id,
    enabled: Boolean(query.data),
  });

  if (query.isLoading) {
    return (
      <AppShell>
        <PageState title="Загружаем работу…" loading />
      </AppShell>
    );
  }
  if (query.isError || !query.data) {
    return (
      <AppShell>
        <PageState
          title="Не удалось загрузить работу"
          retry={() => void query.refetch()}
        />
      </AppShell>
    );
  }

  const { work, author, relatedWorks } = query.data;
  const hasStory = Boolean(visibleWorkStory(work.story));
  const selectedTab = resolveWorkContentTab(activeTab, hasStory);
  const related = relatedWorksExcludingCurrent(relatedWorks, work.publicId);

  return (
    <AppShell>
      <ScrollView
        testID="product-scroll-view"
        contentContainerStyle={{ paddingBottom: designTokens.space.x5 }}
        showsVerticalScrollIndicator={false}
      >
        <WorkGallery images={work.images} label={work.title} />
        <View
          style={{
            paddingHorizontal: designTokens.space.pageGutter,
            paddingTop: designTokens.space.sectionGap,
            gap: designTokens.space.sectionGap,
          }}
        >
          <WorkIdentityBlock
            title={work.title}
            authorName={author.fullName}
            authorSlug={author.slug}
            city={author.city}
            technique={work.technique}
            materials={work.materials}
          />
          <FigmaButton
            label="Поделиться"
            icon="copy"
            variant="ghost"
            onPress={() => setShareOpen(true)}
          />
          <WorkContentTabs
            activeTab={selectedTab}
            hasStory={hasStory}
            onChange={(next) => onTabChange?.(next)}
          />
          {selectedTab === 'story' && hasStory ? (
            <WorkStory story={work.story} />
          ) : (
            <WorkFactsList
              technique={work.technique}
              materials={work.materials}
              dimensions={work.dimensions}
              year={work.year}
              city={author.city}
            />
          )}
          <PaymentDeliveryStub />
          <RelatedWorksSection items={related} />
        </View>
      </ScrollView>
      <ShareSheet
        open={shareOpen}
        url={publicShareUrl(work.sharePath)}
        onClose={() => setShareOpen(false)}
      />
    </AppShell>
  );
}
