import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { Text, YStack } from 'tamagui';

import { formatDisplayPrice } from '../../lib/formatters';
import { mobileRadius, mobileSpacing } from '../../theme/tokens';
import { ColorSwatches } from './ColorSwatches';

export type ProductCardModel = {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  secondaryImageUrl?: string | null;
  colors: readonly string[];
  extraVariants: number;
  statusLabel?: string | null;
  sellerName?: string;
};

type ProductCardProps = {
  product: ProductCardModel;
};

export function ProductCard({ product }: ProductCardProps) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const activeImage = hovered && product.secondaryImageUrl ? product.secondaryImageUrl : product.imageUrl;

  return (
    <Link href={`/product/${product.id}`} asChild>
      <Pressable
        accessibilityRole="link"
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={{ transform: [{ scale: pressed ? 0.99 : 1 }] }}
      >
        <YStack gap={mobileSpacing[2]}>
          <YStack
            style={{
              aspectRatio: 4 / 5,
              backgroundColor: '#F0F0EE',
              overflow: 'hidden',
              borderRadius: mobileRadius.xs,
            }}
          >
            <Image
              source={{ uri: activeImage }}
              style={{
                width: '100%',
                height: '100%',
                transform: [{ scale: hovered ? 1.02 : 1 }],
              }}
              contentFit="contain"
              transition={220}
            />
          </YStack>
          <YStack gap={mobileSpacing['1.5']}>
            <Text
              color="$text"
              fontSize={13}
              lineHeight={18}
              textTransform="uppercase"
              opacity={hovered ? 0.72 : 1}
              textDecorationLine={hovered ? 'underline' : 'none'}
            >
              {product.title}
            </Text>
            <Text color="$textMuted" fontSize={13} lineHeight={18}>
              {formatDisplayPrice(product.price, product.currency)}
            </Text>
            <ColorSwatches colors={product.colors} extraCount={product.extraVariants} />
            {product.statusLabel ? (
              <Text color="$danger" fontSize={12} lineHeight={16}>
                {product.statusLabel}
              </Text>
            ) : null}
          </YStack>
        </YStack>
      </Pressable>
    </Link>
  );
}
