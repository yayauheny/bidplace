import { Image } from 'expo-image';
import { Link } from 'expo-router';
import type { z } from 'zod';
import { useState } from 'react';
import { View } from 'react-native';

import type { publicProductListItemSchema } from '@bidplace/contracts';
import { modernTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { AppText } from './AppText';
import { ImagePlaceholder } from './ImagePlaceholder';
import { MotionPressable } from './MotionPressable';

type AuctionCardItem = z.infer<typeof publicProductListItemSchema>;

function listingLabel(item: AuctionCardItem): string {
  if (!item.listing) return 'Скоро';
  if (item.listing.status === 'LIVE') return 'Торги идут';
  if (item.listing.status === 'SCHEDULED') return 'Скоро';
  if (item.listing.status === 'CANCELLED') return 'Отменено';
  return 'Завершено';
}

function deadlineLabel(item: AuctionCardItem): string {
  if (!item.listing) return 'Листинг готовится';
  return new Intl.DateTimeFormat('ru-BY', { day: 'numeric', month: 'short' }).format(new Date(item.listing.endsAt));
}

export function AuctionCard({ item }: { item: AuctionCardItem }) {
  const { product, sellerProfile, listing } = item;
  const firstImage = product.images[0];
  const price = listing ? `${listing.currentPrice} BYN` : 'Цена появится позже';
  const label = `${product.title ?? 'Предмет'} — ${sellerProfile.fullName}. ${price}. ${listingLabel(item)} до ${deadlineLabel(item)}`;

  return (
    <Link href={`/product/${product.publicId}`} asChild>
      <MotionPressable accessibilityRole="link" accessibilityLabel={label} preset="card" style={{ gap: modernTokens.space.x3 }}>
        {firstImage ? (
          <AuctionCardImage imageId={firstImage.id} imageUrl={firstImage.url} label={product.title ?? 'Предмет'} productId={product.id} />
        ) : (
          <ImagePlaceholder label={`Нет изображения: ${product.title ?? 'предмет'}`} style={{ width: '100%' }} />
        )}
        <View style={{ gap: modernTokens.space.x1 }}>
          <AppText role="metadata" tone="secondary" numberOfLines={1}>{sellerProfile.fullName}</AppText>
          <AppText role="cardTitle" numberOfLines={2}>{product.title ?? 'Предмет'}</AppText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: modernTokens.space.x2 }}>
            <AppText role="numeric">{price}</AppText>
            <AppText role="caption" tone={listing?.status === 'LIVE' ? 'accent' : 'secondary'}>{listingLabel(item)} · {deadlineLabel(item)}</AppText>
          </View>
        </View>
      </MotionPressable>
    </Link>
  );
}

function AuctionCardImage({ imageId, imageUrl, label, productId }: { imageId: string; imageUrl: string; label: string; productId: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <ImagePlaceholder label={`Изображение недоступно: ${label}`} style={{ width: '100%' }} />;
  }

  return (
    <Image
      source={{ uri: getApiAssetUrl(imageUrl) }}
      contentFit="cover"
      transition={modernTokens.motion.fast}
      recyclingKey={`${productId}-${imageId}`}
      accessibilityLabel={`Изображение предмета: ${label}`}
      onError={() => setFailed(true)}
      style={{ width: '100%', aspectRatio: 4 / 5, borderRadius: modernTokens.radius.image, backgroundColor: modernTokens.color.placeholder }}
    />
  );
}
