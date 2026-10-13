import { useQuery } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { BidplaceMark } from '../../components/branding/BidplaceBrand';
import { AppShell } from '../../components/layout/AppShell';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import { infrastructurePageFetchStatus } from '../../components/shared/infrastructure-page-status';
import { AppText, PageState, PrimaryButton } from '../../components/ui';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { useApiClient } from '../../providers/api-provider';
import { HomeNewAuthors } from './home-new-authors';
import { HomeNewWorks } from './home-new-works';
import { HomeOpening } from './home-opening';
import { PublicFooter } from '../auth/legal-footer';
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

  return (
    <AppShell hideDock={hideDock}>
      <ScrollView
        testID="home-scroll"
        contentContainerStyle={{
          paddingHorizontal: designTokens.space.pageGutter,
          paddingTop: designTokens.space.x3,
          paddingBottom: hideDock
            ? designTokens.space.x6
            : designTokens.size.dockReserve,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          testID="home-header"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: designTokens.size.touch,
            marginBottom: designTokens.space.x10,
          }}
        >
          <View style={{ width: designTokens.size.touch, alignItems: 'center' }}>
            <BidplaceMark size={32} />
          </View>
          <View
            style={{
              flex: 1,
              minWidth: 0,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: designTokens.space.x5,
            }}
          >
            <AppText
              role="nav"
              style={{
                color: designTokens.color.inkStrong,
                fontFamily: designTokens.typography.sectionTitle.fontFamily,
              }}
            >
              Для вас
            </AppText>
            <Link href="/followed-authors" asChild>
              <MotionPressable accessibilityRole="link" accessibilityLabel="Ваши авторы" preset="button">
                <AppText role="nav" tone="secondary">Ваши авторы</AppText>
              </MotionPressable>
            </Link>
          </View>
          <Link href="/notifications" asChild>
            <MotionPressable
              accessibilityRole="link"
              accessibilityLabel="Уведомления"
              preset="icon"
              style={{
                width: designTokens.size.touch,
                height: designTokens.size.touch,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={24} color={designTokens.color.inkStrong} strokeWidth={1.8} />
            </MotionPressable>
          </Link>
        </View>
        {pageStatus !== 'ready' ? (
          <InfrastructurePageStatus
            status={pageStatus}
            onRetry={() => void home.refetch()}
          />
        ) : (
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
        )}
        <PublicFooter inset />
      </ScrollView>
    </AppShell>
  );
}
