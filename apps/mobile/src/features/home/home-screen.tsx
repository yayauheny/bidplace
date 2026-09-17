import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { BrandLogo } from '../../components/layout/BrandLogo';
import { AppShell } from '../../components/layout';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import { infrastructurePageFetchStatus } from '../../components/shared/infrastructure-page-status';
import { PageState, PrimaryButton } from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { HomeNewAuthors } from './home-new-authors';
import { HomeNewWorks } from './home-new-works';
import { HomeOpening } from './home-opening';
import { homeSectionPlan } from './home-sections';

export function HomeScreen() {
  const api = useApiClient();
  const router = useRouter();
  const home = useQuery({
    queryKey: ['portfolio-home'],
    queryFn: () => api.portfolio.home(),
  });
  const pageStatus = infrastructurePageFetchStatus(home);
  const plan = homeSectionPlan(home.data);

  if (pageStatus !== 'ready') {
    return (
      <AppShell>
        <InfrastructurePageStatus
          status={pageStatus}
          onRetry={() => void home.refetch()}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ScrollView
        testID="home-scroll"
        contentContainerStyle={{
          paddingHorizontal: designTokens.space.pageGutter,
          paddingTop: designTokens.space.logoTop,
          paddingBottom: designTokens.size.dockReserve,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            alignItems: 'center',
            marginBottom: designTokens.space.logoGap,
          }}
        >
          <BrandLogo profile />
        </View>
        <View style={{ gap: designTokens.space.homeSectionStack, minWidth: 0 }}>
          {plan.opening ? <HomeOpening selection={plan.opening} /> : null}
          {plan.showWorks ? <HomeNewWorks works={plan.works} /> : null}
          {plan.showAuthors ? <HomeNewAuthors authors={plan.authors} /> : null}
          {plan.showAuthorsLink ? (
            <PrimaryButton
              label="Все авторы"
              width="full"
              onPress={() => router.push('/authors')}
            />
          ) : null}
          {plan.showEmpty ? (
            <View style={{ gap: designTokens.space.sectionGap }}>
              <PageState
                title="Пока здесь тихо"
                message="Новые работы и авторы появятся после публикации."
              />
              <PrimaryButton
                label="Все работы"
                width="full"
                onPress={() => router.push('/works')}
              />
              <PrimaryButton
                label="Все авторы"
                width="full"
                onPress={() => router.push('/authors')}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </AppShell>
  );
}
