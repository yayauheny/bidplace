import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { ScrollView, View } from 'react-native';

import type { ApiClient } from '@bidplace/api-client';
import { modernTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout/AppShell';
import {
  AppText,
  MotionPressable,
  PrimaryButton,
  SecondaryButton,
} from '../../components/modern-ui';
import { useApiClient } from '../../providers/api-provider';

type ActivityData = Awaited<ReturnType<ApiClient['activity']['get']>>;
type ActivityItem = ActivityData['activity'][number];

function activityStatusLabel(status: ActivityItem['status']): string {
  return {
    LEADING: 'Побеждаете',
    OUTBID: 'Ставка перебита',
    WON: 'Выиграли',
    LOST: 'Торги завершены',
    AWAITING_SELLER_CONTACT: 'Ожидаем контакта продавца',
    COMPLETED: 'Передача завершена',
    WIN_CANCELLED: 'Заказ отменён',
  }[status];
}

function activityStatusTone(
  status: ActivityItem['status'],
): 'accent' | 'success' | 'secondary' {
  if (status === 'LEADING' || status === 'WON') return 'success';
  if (status === 'OUTBID') return 'accent';
  return 'secondary';
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const status = activityStatusLabel(item.status);
  return (
    <View
      style={{
        gap: modernTokens.space.x3,
        borderBottomWidth: 1,
        borderBottomColor: modernTokens.color.border,
        paddingBottom: modernTokens.space.x4,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: modernTokens.space.x3,
        }}
      >
        <Link href={`/product/${item.product.publicId}`} asChild>
          <MotionPressable
            accessibilityRole="link"
            accessibilityLabel={`Открыть предмет ${item.product.title ?? 'Предмет'}`}
            onPress={() => undefined}
            preset="card"
            style={{ flex: 1, gap: modernTokens.space.x1 }}
          >
            <AppText role="cardTitle">
              {item.product.title ?? 'Предмет'}
            </AppText>
            <AppText role="bodySmall" tone="secondary">
              Открыть предмет
            </AppText>
          </MotionPressable>
        </Link>
        <AppText
          role="caption"
          tone={activityStatusTone(item.status)}
          style={{
            backgroundColor: modernTokens.color.chip,
            borderRadius: modernTokens.radius.pill,
            overflow: 'hidden',
            paddingHorizontal: modernTokens.space.x2,
            paddingVertical: modernTokens.space.x1,
          }}
        >
          {status}
        </AppText>
      </View>
      {item.orderPublicId ? (
        <Link
          href={{
            pathname: '/order/[publicId]',
            params: { publicId: item.orderPublicId },
          }}
          asChild
        >
          <SecondaryButton label="Открыть заказ" onPress={() => undefined} />
        </Link>
      ) : null}
    </View>
  );
}

export function ActivityScreen() {
  const api = useApiClient();
  const query = useQuery({
    queryKey: ['user', 'activity'],
    queryFn: () => api.activity.get(),
  });

  let content: React.ReactNode;
  if (query.isLoading) {
    content = (
      <View style={{ paddingVertical: modernTokens.space.x16 }}>
        <AppText role="bodySmall" tone="secondary">
          Загружаем покупки…
        </AppText>
      </View>
    );
  } else if (query.isError || !query.data) {
    content = (
      <View
        style={{
          alignItems: 'center',
          gap: modernTokens.space.x4,
          paddingVertical: modernTokens.space.x16,
        }}
      >
        <AppText role="sectionTitle">Не удалось загрузить покупки</AppText>
        <PrimaryButton label="Повторить" onPress={() => void query.refetch()} />
      </View>
    );
  } else if (query.data.activity.length === 0) {
    content = (
      <View
        style={{
          alignItems: 'center',
          gap: modernTokens.space.x3,
          paddingVertical: modernTokens.space.x16,
        }}
      >
        <AppText role="sectionTitle">Пока нет торгов</AppText>
        <AppText
          role="bodySmall"
          tone="secondary"
          style={{ textAlign: 'center' }}
        >
          Ваши ставки и результаты появятся здесь.
        </AppText>
      </View>
    );
  } else {
    content = (
      <View style={{ gap: modernTokens.space.x4 }}>
        {query.data.activity.map((item) => (
          <ActivityRow key={item.listing.id} item={item} />
        ))}
      </View>
    );
  }

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          paddingHorizontal: modernTokens.space.x5,
          paddingVertical: modernTokens.space.x8,
          gap: modernTokens.space.x6,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: modernTokens.space.x2 }}>
          <AppText role="screenTitle">Мои покупки</AppText>
          <AppText role="bodySmall" tone="secondary">
            Статусы ваших ставок и заказов.
          </AppText>
        </View>
        {content}
      </ScrollView>
    </AppShell>
  );
}
