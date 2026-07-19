// ProductCard — image-first item card for the catalog grid.
// Responsibility: display one product item with optional listing price/status.
// Do not add bid actions here — those live in ProductScreen.
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable } from 'react-native';
import { Text, YStack, XStack } from 'tamagui';

import type { publicProductListItemSchema } from '@bidplace/contracts';
import type { z } from 'zod';

type ProductListItem = z.infer<typeof publicProductListItemSchema>;
type PublicSellerProfile = ProductListItem['sellerProfile'];
type Product = ProductListItem['product'];
type Listing = NonNullable<ProductListItem['listing']>;
import { getApiUrl } from '../../lib/environment';
import { fontFamilies, mobileRadius, mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';

type ProductCardProps = {
  product: Product;
  listing: Listing | null;
  sellerProfile: PublicSellerProfile;
};

function listingStatusLabel(status: Listing['status']): string {
  return {
    LIVE: 'Торги идут',
    SCHEDULED: 'Скоро',
    ENDED: 'Завершено',
    CANCELLED: 'Отменено',
    DRAFT: 'Черновик',
  }[status] ?? status;
}

function listingStatusTone(status: Listing['status']): string {
  if (status === 'LIVE') return '#247A4A';
  if (status === 'SCHEDULED') return '#2457E6';
  return '#7A7A7A';
}

export function ProductCard({ product, listing, sellerProfile }: ProductCardProps) {
  const palette = useAppThemePalette();
  const firstImage = product.images[0];
  const imageUri = firstImage ? `${getApiUrl()}${firstImage.url}` : null;

  return (
    <Link href={`/product/${product.publicId}`} asChild>
      <Pressable
        accessibilityRole="link"
        aria-label={`${product.title ?? 'Предмет'} — ${sellerProfile.storeName}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <YStack style={{ gap: mobileSpacing[2] }}>
          {/* Image */}
          <YStack
            style={{
              aspectRatio: 4 / 5,
              borderRadius: mobileRadius.panel,
              overflow: 'hidden',
              backgroundColor: palette.imageBackground,
            }}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                recyclingKey={product.id}
              />
            ) : (
              /* Image placeholder — preserves grid geometry */
              <YStack style={{ flex: 1 }} />
            )}
          </YStack>

          {/* Meta */}
          <YStack style={{ gap: mobileSpacing[1] }}>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: fontFamilies.sansRegular,
                fontSize: 13,
                lineHeight: 18,
                color: palette.colorMuted,
                letterSpacing: 0.1,
              }}
            >
              {sellerProfile.storeName}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: fontFamilies.sansStrong,
                fontSize: 14,
                lineHeight: 20,
                color: palette.color,
                fontWeight: '600',
              }}
            >
              {product.title ?? 'Предмет'}
            </Text>

            {listing ? (
              <XStack style={{ alignItems: 'center', gap: mobileSpacing[2] }}>
                <Text
                  style={{
                    fontFamily: fontFamilies.sansStrong,
                    fontSize: 14,
                    lineHeight: 20,
                    color: palette.color,
                    fontWeight: '600',
                  }}
                >
                  {listing.currentPrice} BYN
                </Text>
                {listing.status !== 'ENDED' && listing.status !== 'CANCELLED' ? (
                  <Text
                    style={{
                      fontFamily: fontFamilies.sansMedium,
                      fontSize: 11,
                      lineHeight: 14,
                      color: listingStatusTone(listing.status),
                      fontWeight: '500',
                    }}
                  >
                    {listingStatusLabel(listing.status)}
                  </Text>
                ) : null}
              </XStack>
            ) : null}
          </YStack>
        </YStack>
      </Pressable>
    </Link>
  );
}
