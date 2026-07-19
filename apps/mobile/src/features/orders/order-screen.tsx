import { useQuery } from '@tanstack/react-query';
import { YStack } from 'tamagui';

import {
  DetailList,
  ErrorState,
  LoadingState,
  OperationalPanel,
  Screen,
  SectionHeader,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { mobileSpacing } from '../../theme/tokens';

export function OrderScreen({ publicId }: { publicId: string }) {
  const api = useApiClient();
  const query = useQuery({
    queryKey: ['orders', publicId],
    queryFn: () => api.orders.get(publicId),
  });

  if (query.isLoading)
    return (
      <Screen>
        <LoadingState label="Загружаем заказ" />
      </Screen>
    );
  if (query.isError || !query.data)
    return (
      <Screen>
        <ErrorState
          description="Заказ недоступен"
          onAction={() => query.refetch()}
        />
      </Screen>
    );

  const { order, productSummary } = query.data;

  return (
    <Screen>
      <YStack style={{ gap: mobileSpacing[5] }}>
        <SectionHeader title={`Заказ ${order.publicId}`} />
        <OperationalPanel>
          <DetailList
            items={[
              { label: 'Предмет', value: productSummary.title ?? 'Предмет' },
              { label: 'Итоговая сумма', value: `${order.finalAmount} BYN`, accent: true },
              {
                label: 'Связаться до',
                value: new Date(order.contactDueAt).toLocaleString('ru-BY'),
              },
            ]}
          />
        </OperationalPanel>
      </YStack>
    </Screen>
  );
}
