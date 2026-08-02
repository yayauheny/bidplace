import { Image } from 'expo-image';
import { Link } from 'expo-router';
import type { z } from 'zod';
import { useState } from 'react';
import { View } from 'react-native';

import type { publicProductListItemSchema } from '@bidplace/contracts';
import { modernTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { getMotionDuration, useReducedMotion } from '../../lib/reduced-motion';
import { getAuctionCardContent } from './auction-card-layout';
import { AppText } from './AppText';
import { ImagePlaceholder } from './ImagePlaceholder';
import { MotionPressable } from './MotionPressable';
import { productMediaStyle } from './product-media-style';

type AuctionCardItem = z.infer<typeof publicProductListItemSchema>;

export function AuctionCard({ item }: { item: AuctionCardItem }) {
  const { product, sellerProfile, listing } = item;
  const firstImage = product.images[0];
  const { title, description, price, status, deadline } =
    getAuctionCardContent(item);
  const label = `${title} — ${sellerProfile.fullName}. ${price}. ${status} до ${deadline}`;

  return (
    <Link href={`/product/${product.publicId}`} asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={label}
        preset="card"
        style={{ gap: modernTokens.space.x3 }}
      >
        {firstImage ? (
          <AuctionCardImage
            imageId={firstImage.id}
            imageUrl={firstImage.url}
            label={title}
            productId={product.id}
          />
        ) : (
          <ImagePlaceholder
            label={`Нет изображения: ${title}`}
            style={{ width: '100%' }}
          />
        )}
        <View style={{ gap: modernTokens.space.x1 }}>
          <AppText role="metadata" tone="secondary" numberOfLines={1}>
            {sellerProfile.fullName}
          </AppText>
          <AppText role="cardTitle" numberOfLines={2}>
            {title}
          </AppText>
          <AppText role="bodySmall" tone="secondary" numberOfLines={1}>
            {description}
          </AppText>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: modernTokens.space.x2,
              minWidth: 0,
            }}
          >
            <AppText role="numeric" numberOfLines={1} style={{ flexShrink: 0 }}>
              {price}
            </AppText>
            <AppText
              role="caption"
              tone={listing?.status === 'LIVE' ? 'success' : 'secondary'}
              numberOfLines={1}
              style={{ flex: 1, flexShrink: 1, textAlign: 'right' }}
            >
              {status} · {deadline}
            </AppText>
          </View>
        </View>
      </MotionPressable>
    </Link>
  );
}

function AuctionCardImage({
  imageId,
  imageUrl,
  label,
  productId,
}: {
  imageId: string;
  imageUrl: string;
  label: string;
  productId: string;
}) {
  const [failed, setFailed] = useState(false);
  const reducedMotion = useReducedMotion();

  if (failed) {
    return (
      <ImagePlaceholder
        label={`Изображение недоступно: ${label}`}
        style={productMediaStyle()}
      />
    );
  }

  return (
    <Image
      source={{ uri: getApiAssetUrl(imageUrl) }}
      contentFit="contain"
      transition={getMotionDuration(reducedMotion, modernTokens.motion.fast)}
      recyclingKey={`${productId}-${imageId}`}
      accessibilityLabel={`Изображение предмета: ${label}`}
      onError={() => setFailed(true)}
      style={productMediaStyle()}
    />
  );
}
