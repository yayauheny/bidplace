import type { PublicSellerListItem } from '@bidplace/contracts';
import { Link } from 'expo-router';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { presentEnum, sellerTypeLabels } from '../../lib/presentation';
import { AppText } from './AppText';
import { MotionPressable } from './MotionPressable';
import { ResilientRemoteImage } from './ResilientRemoteImage';

export function CreatorCard({ item }: { item: PublicSellerListItem }) {
  const { sellerProfile } = item;

  return (
    <Link
      href={{
        pathname: '/seller/[slug]',
        params: { slug: sellerProfile.slug },
      }}
      asChild
    >
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={`Открыть профиль автора ${sellerProfile.fullName}`}
        preset="card"
        style={{
          gap: designTokens.space.x3,
        }}
      >
        <ResilientRemoteImage
          uri={getApiAssetUrl(sellerProfile.profilePhotoUrl)}
          component="CreatorCard"
          accessibilityLabel={`Фото автора ${sellerProfile.fullName}`}
          fallbackLabel={`Фото автора недоступно: ${sellerProfile.fullName}`}
          style={{
            width: '100%',
            aspectRatio: 1,
            borderRadius: designTokens.radius.media,
          }}
          contentFit="cover"
        />
        <View
          style={{
            gap: designTokens.space.x1,
          }}
        >
          <AppText role="cardTitle" numberOfLines={1}>
            {sellerProfile.fullName}
          </AppText>
          <AppText role="bodySmall" tone="secondary" numberOfLines={1}>
            {presentEnum(
              sellerProfile.sellerType,
              sellerTypeLabels,
              'Автор',
            )}
          </AppText>
        </View>
      </MotionPressable>
    </Link>
  );
}
