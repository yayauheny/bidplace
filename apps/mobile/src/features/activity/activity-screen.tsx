import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Text, YStack } from 'tamagui';

import {
  AppButton,
  EmptyState,
  ErrorState,
  LoadingState,
  OperationalPanel,
  Screen,
  SectionHeader,
  StatusBadge,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { useAppThemePalette } from '../../theme/palette';
import { fontFamilies, mobileSpacing } from '../../theme/tokens';

type ActivityItem = {
  listing: { id: string };
  status: string;
  orderPublicId: string | null;
  product: { publicId: string; title: string | null };
};
type ActivityData = { activity: ActivityItem[] };

type ParticipationStatus = string;

function activityStatusTone(
  status: ParticipationStatus,
): 'positive' | 'warning' | 'neutral' {
  if (status === 'LEADING' || status === 'WON') return 'positive';
  if (status === 'OUTBID') return 'warning';
  return 'neutral';
}

function activityStatusLabel(status: ParticipationStatus): string {
  const labels: Record<string, string> = {
    LEADING: 'Лидирует',
    OUTBID: 'Перебита',
    WON: 'Победа',
    LOST: 'Завершено',
  };
  return labels[status] ?? status;
}

export function ActivityScreen() {
  const api = useApiClient();
  const palette = useAppThemePalette();
  const query = useQuery({
    queryKey: ['user', 'activity'],
    queryFn: () => api.activity.get() as Promise<ActivityData>,
  });

  if (query.isLoading)
    return (
      <Screen>
        <LoadingState label="Загружаем покупки" />
      </Screen>
    );
  if (query.isError || !query.data)
    return (
      <Screen>
        <ErrorState
          description="Не удалось загрузить покупки"
          onAction={() => query.refetch()}
        />
      </Screen>
    );

  const { activity } = query.data;

  return (
    <Screen>
      <YStack style={{ gap: mobileSpacing[5] }}>
        <SectionHeader title="Мои покупки" />

        {activity.length === 0 ? (
          <EmptyState description="У вас ещё нет активных торгов" />
        ) : (
          <YStack style={{ gap: mobileSpacing[3] }}>
            {activity.map((item: ActivityItem) => (
              <OperationalPanel key={item.listing.id}>
                <YStack style={{ gap: mobileSpacing[3] }}>
                  <StatusBadge tone={activityStatusTone(item.status)}>
                    {activityStatusLabel(item.status)}
                  </StatusBadge>
                  <Link href={`/product/${item.product.publicId}`} asChild>
                    <Text
                      style={{
                        fontFamily: fontFamilies.sansStrong,
                        fontSize: 16,
                        lineHeight: 22,
                        color: palette.primary,
                        fontWeight: '600',
                      }}
                    >
                      {item.product.title ?? 'Предмет'}
                    </Text>
                  </Link>
                  {item.orderPublicId ? (
                    <Link href={`/order/${item.orderPublicId}` as never} asChild>
                      <AppButton tone="secondary" buttonSize="small">
                        Открыть заказ
                      </AppButton>
                    </Link>
                  ) : null}
                </YStack>
              </OperationalPanel>
            ))}
          </YStack>
        )}
      </YStack>
    </Screen>
  );
}
