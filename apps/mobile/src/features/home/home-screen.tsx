import { PageScrollView } from '../../components/layout/PageScrollView';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout/AppShell';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import { infrastructurePageFetchStatus } from '../../components/shared/infrastructure-page-status';
import { PageState, PrimaryButton } from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { HomeNewAuthors } from './home-new-authors';
import { HomeNewWorks } from './home-new-works';
import { HomeOpening } from './home-opening';
import { homeSectionPlan } from './home-sections';

export function HomeScreen({ hideDock = false }: { hideDock?: boolean }) {
  const api = useApiClient();
  const router = useRouter();
  const home = useQuery({
    queryKey: ['portfolio-home'],
    queryFn: ({ signal }) => api.portfolio.home({ signal }),
  });
  const pageStatus = infrastructurePageFetchStatus(home);
  const plan = homeSectionPlan(home.data);

  if (pageStatus !== 'ready') {
    return (
      <AppShell hideDock={hideDock} contentLayout="bleed">
        <PageScrollView>
          <InfrastructurePageStatus
            status={pageStatus}
            onRetry={() => void home.refetch()}
          />
        </PageScrollView>
      </AppShell>
    );
  }

  return (
    <AppShell hideDock={hideDock} contentLayout="bleed">
      <PageScrollView
        variant="branded"
        reserveDock={!hideDock}
        testID="home-scroll"
        contentContainerStyle={{
          paddingBottom: hideDock ? designTokens.space.x8 : 0,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: designTokens.space.homeSectionStack, minWidth: 0 }}>
          {plan.opening ? <HomeOpening selection={plan.opening} /> : null}
          {plan.showWorks ? <HomeNewWorks works={plan.works} /> : null}
          {plan.showAuthors ? <HomeNewAuthors authors={plan.authors} /> : null}
          {plan.showAuthorsLink ? (
            <View
              style={{
                width: '100%',
                maxWidth: designTokens.layout.actionColumnMax,
                alignSelf: 'center',
              }}
            >
              <PrimaryButton
                label="Все авторы"
                width="full"
                onPress={() => router.push('/explore?section=authors')}
              />
            </View>
          ) : null}
          {plan.showEmpty ? (
            <View style={{ gap: designTokens.space.sectionGap }}>
              <PageState
                title="Пока здесь тихо"
                message="Новые работы и авторы появятся после публикации."
              />
              <View
                testID="empty-home-actions"
                style={{
                  width: '100%',
                  maxWidth: designTokens.layout.actionColumnMax,
                  alignSelf: 'center',
                  gap: designTokens.space.sectionGap,
                }}
              >
                <PrimaryButton
                  label="Все работы"
                  width="full"
                  onPress={() => router.push('/explore?section=works')}
                />
                <PrimaryButton
                  label="Все авторы"
                  width="full"
                  onPress={() => router.push('/explore?section=authors')}
                />
              </View>
            </View>
          ) : null}
        </View>
      </PageScrollView>
    </AppShell>
  );
}
