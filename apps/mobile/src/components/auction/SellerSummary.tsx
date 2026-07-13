import type { SellerProfile } from '@bidplace/contracts';

import { AppCard, AppButton } from '../ui';
import { formatNumber } from '../../lib/formatters';
import { mobileSpacing } from '../../theme/tokens';
import { Text, XStack, YStack } from 'tamagui';
import { useRouter } from 'expo-router';
import { useAppThemePalette } from '../../theme/palette';

type SellerSummaryProps = {
  sellerProfile: SellerProfile;
  auctionCount?: number;
};

export function SellerSummary({ sellerProfile, auctionCount }: SellerSummaryProps) {
  const router = useRouter();
  const palette = useAppThemePalette();

  return (
    <AppCard>
      <YStack style={{ gap: mobileSpacing[3] }}>
        <Text style={{ fontSize: 20, lineHeight: 26, fontWeight: '700', color: palette.text }}>
          {sellerProfile.storeName}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textMuted }}>
          {sellerProfile.shortDescription ?? 'Описание не заполнено'}
        </Text>
        <XStack style={{ flexWrap: 'wrap', gap: mobileSpacing[2] }}>
          <Text style={{ fontSize: 14, lineHeight: 20, color: palette.text }}>
            Страна: {sellerProfile.country}
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: palette.text }}>
            Тип: {sellerProfile.sellerType}
          </Text>
          {typeof auctionCount === 'number' ? (
            <Text style={{ fontSize: 14, lineHeight: 20, color: palette.text }}>
              Аукционов: {formatNumber(auctionCount)}
            </Text>
          ) : null}
        </XStack>
        <AppButton tone="secondary" onPress={() => router.push(`/sellers/${sellerProfile.slug}`)}>
          Открыть профиль
        </AppButton>
      </YStack>
    </AppCard>
  );
}
