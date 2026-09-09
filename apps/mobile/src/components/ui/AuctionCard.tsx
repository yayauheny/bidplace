import { Link } from 'expo-router';
import { useState } from 'react';
import { Platform, View, type ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { getMotionDuration, useReducedMotion } from '../../lib/reduced-motion';
import { getAuctionCardContent } from './auction-card-layout';
import { type AuctionCardItem } from './auction-card-item';
import { AppText } from './AppText';
import { MotionPressable } from './MotionPressable';
import { ResilientRemoteImage } from './ResilientRemoteImage';

export function AuctionCard({ item }: { item: AuctionCardItem }) {
  const { product, sellerProfile, listing } = item;
  const firstImage = product.images[0]!;
  const { title, price, status, deadline } = getAuctionCardContent(item);
  const [mediaEmphasized, setMediaEmphasized] = useState(false);
  const reducedMotion = useReducedMotion();
  const label = `${title} — ${sellerProfile.fullName}. ${price}. ${status}: ${deadline}`;
  const live = listing?.status === 'LIVE';

  return (
    <Link href={`/product/${product.publicId}`} asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={label}
        onBlur={() => setMediaEmphasized(false)}
        onFocus={() => setMediaEmphasized(true)}
        onHoverIn={() => setMediaEmphasized(true)}
        onHoverOut={() => setMediaEmphasized(false)}
        preset="card"
        style={{
          width: '100%',
          overflow: 'hidden',
          borderRadius: designTokens.radius.media,
        }}
      >
        <View
          style={{
            width: '100%',
            aspectRatio: designTokens.ratio.auctionCardMedia,
            overflow: 'hidden',
            backgroundColor: designTokens.color.surfaceMuted,
          }}
        >
          <AuctionCardImage
            emphasized={mediaEmphasized}
            imageId={firstImage.id}
            imageUrl={firstImage.url}
            label={title}
            productId={product.id}
            reducedMotion={reducedMotion}
          />
        </View>
        <View
          style={{
            overflow: 'hidden',
            borderWidth: 1,
            borderTopWidth: 0,
            borderColor: designTokens.color.border,
            borderBottomLeftRadius: designTokens.radius.media,
            borderBottomRightRadius: designTokens.radius.media,
            backgroundColor: designTokens.color.surfaceMuted,
          }}
        >
          <View
            style={{
              gap: designTokens.space.x1,
              paddingTop: 14,
              paddingHorizontal: designTokens.space.x4,
              paddingBottom: 13,
            }}
          >
            <AppText role="label" numberOfLines={2} style={{ fontSize: 16, lineHeight: 20, fontWeight: '700' }}>
              {title}
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ResilientRemoteImage
                uri={getApiAssetUrl(sellerProfile.profilePhotoUrl)}
                component="AuctionCard"
                accessibilityLabel={`Фото автора: ${sellerProfile.fullName}`}
                fallbackLabel={`Фото автора недоступно: ${sellerProfile.fullName}`}
                style={{ width: 18, height: 18, borderRadius: 9 }}
                contentFit="cover"
              />
              <AppText role="bodySmall" tone="secondary" numberOfLines={1}>
                @{sellerProfile.slug}
              </AppText>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: designTokens.space.x3,
              borderTopWidth: 1,
              borderTopColor: designTokens.color.border,
              paddingTop: 13,
              paddingHorizontal: designTokens.space.x4,
              paddingBottom: 15,
            }}
          >
            <Metric label={live ? 'Текущая ставка' : 'Цена'} value={price} />
            <Metric
              align="right"
              label={status}
              value={deadline}
              tone={live ? 'success' : 'secondary'}
            />
          </View>
        </View>
      </MotionPressable>
    </Link>
  );
}

function Metric({
  align = 'left',
  label,
  tone = 'secondary',
  value,
}: {
  align?: 'left' | 'right';
  label: string;
  tone?: 'secondary' | 'success';
  value: string;
}) {
  return (
    <View
      style={{
        minWidth: 0,
        alignItems: align === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      <AppText role="metadata" tone={tone} numberOfLines={1}>
        {label}
      </AppText>
      <AppText
        role="numeric"
        numberOfLines={1}
        style={{ fontSize: 16, lineHeight: 19 }}
      >
        {value}
      </AppText>
    </View>
  );
}

function AuctionCardImage({
  emphasized,
  imageId,
  imageUrl,
  label,
  productId,
  reducedMotion,
}: {
  emphasized: boolean;
  imageId: string;
  imageUrl: string;
  label: string;
  productId: string;
  reducedMotion: boolean;
}) {
  const webTransition =
    Platform.OS === 'web'
      ? ({
          transitionDuration: `${getMotionDuration(reducedMotion, designTokens.motion.media)}ms`,
          transitionProperty: 'transform',
          transitionTimingFunction: designTokens.motion.easing,
        } as unknown as ViewStyle)
      : undefined;

  return (
    <ResilientRemoteImage
      uri={getApiAssetUrl(imageUrl)}
      component="AuctionCard"
      accessibilityLabel={`Изображение предмета: ${label}`}
      fallbackLabel={`Изображение недоступно: ${label}`}
      style={[
        {
          width: '100%',
          height: '100%',
          borderRadius: 0,
          backgroundColor: designTokens.color.surfaceStrong,
          transform: [{ scale: emphasized && !reducedMotion ? 1.05 : 1 }],
        },
        webTransition,
      ]}
      contentFit="cover"
      transition={getMotionDuration(reducedMotion, designTokens.motion.fast)}
      recyclingKey={`${productId}-${imageId}`}
    />
  );
}
