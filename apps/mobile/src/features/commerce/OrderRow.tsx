import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { View } from 'react-native';
import type { OrderSummary } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { AppText, ImagePlaceholder, MotionPressable } from '../../components/ui';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { getApiAssetUrl } from '../../lib/environment';
import { formatMoney } from '../../lib/money';
import { orderStatusLabel, orderTiming } from './order-view';

export function OrderRow({ order }: { order: OrderSummary }) {
  const router = useRouter();
  const timing = orderTiming(order);
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={`${order.workTitle}, ${orderStatusLabel(order)}`}
      onPress={() => router.push(`/account/orders/${order.publicId}` as Href)}
      preset="card"
      style={{ flexDirection: 'row', gap: designTokens.space.x3, alignItems: 'center' }}
    >
      {order.coverImageUrl ? (
        <Image
          source={{ uri: getApiAssetUrl(order.coverImageUrl) }}
          accessibilityLabel=""
          contentFit="cover"
          style={{ width: 56, height: 72, borderRadius: designTokens.radius.image }}
        />
      ) : (
        <View style={{ width: 56 }}>
          <ImagePlaceholder ratio={56 / 72} label="Нет обложки" />
        </View>
      )}
      <View style={{ flex: 1, gap: designTokens.space.x1 }}>
        <AppText role="body">{order.workTitle}</AppText>
        <AppText role="caption">{formatMoney(order.amountMinor, order.currency)}</AppText>
        <StatusBadge tone={tone(order.status)} label={orderStatusLabel(order)} />
        {timing ? <AppText role="caption">{timing}</AppText> : null}
        <AppText role="caption">{order.dealCode}</AppText>
      </View>
    </MotionPressable>
  );
}

function tone(status: OrderSummary['status']) {
  if (status === 'COMPLETED') return 'success' as const;
  if (status === 'FAILED') return 'danger' as const;
  if (status === 'OFFERED') return 'accent' as const;
  return 'neutral' as const;
}
