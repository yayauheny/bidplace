import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { View } from 'react-native';

import type { ApiClient } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';

import { FormPageShell } from '../../components/layout/FormPageShell';
import {
  AppText,
  MotionPressable,
  PageHeader,
  PageState,
  SecondaryButton,
} from '../../components/ui';
import { formatCurrencyAmount, formatDateTime } from '../../lib/formatters';
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
        gap: designTokens.space.x3,
        borderWidth: 1,
        borderColor: designTokens.color.border,
        borderRadius: designTokens.radius.panel,
        backgroundColor: designTokens.color.surfaceWarm,
        padding: designTokens.space.x5,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: designTokens.space.x3,
        }}
      >
        <Link href={`/product/${item.product.publicId}`} asChild>
          <MotionPressable
            accessibilityRole="link"
            accessibilityLabel={`Открыть предмет ${item.product.title}`}
            onPress={() => undefined}
            preset="card"
            style={{ flex: 1, minWidth: 0, gap: designTokens.space.x1 }}
          >
            <AppText role="cardTitle">{item.product.title}</AppText>
            <AppText role="metadata" tone="secondary">
              {formatCurrencyAmount(item.listing.currentPrice)} · до{' '}
              {formatDateTime(item.listing.endsAt)}
            </AppText>
          </MotionPressable>
        </Link>
        <AppText
          role="caption"
          tone={activityStatusTone(item.status)}
          style={{
            backgroundColor: designTokens.color.chip,
            borderRadius: designTokens.radius.pill,
            overflow: 'hidden',
            paddingHorizontal: designTokens.space.x2,
            paddingVertical: designTokens.space.x1,
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
          <SecondaryButton
            label="Открыть заказ"
            width="block"
            onPress={() => undefined}
          />
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
    content = <PageState title="Загружаем покупки…" loading />;
  } else if (query.isError || !query.data) {
    content = (
      <PageState
        title="Не удалось загрузить покупки"
        retry={() => void query.refetch()}
      />
    );
  } else if (query.data.activity.length === 0) {
    content = (
      <PageState
        title="Пока нет торгов"
        message="Ваши ставки и результаты появятся здесь."
      />
    );
  } else {
    content = (
      <View style={{ gap: designTokens.space.x4 }}>
        {query.data.activity.map((item) => (
          <ActivityRow key={item.listing.id} item={item} />
        ))}
      </View>
    );
  }

  return (
    <FormPageShell maxWidth={760}>
      <PageHeader
        title="Мои покупки"
        description="Статусы ваших ставок и заказов."
      />
      {content}
    </FormPageShell>
  );
}
