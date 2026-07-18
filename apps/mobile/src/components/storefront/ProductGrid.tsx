import { XStack, YStack, useMedia } from 'tamagui';

import { mobileSpacing } from '../../theme/tokens';
import { LoadingProductCard } from './LoadingProductCard';
import { ProductCard, type ProductCardModel } from './ProductCard';

type ProductGridProps = {
  products: readonly ProductCardModel[];
  loading?: boolean;
};

export function ProductGrid({ products, loading = false }: ProductGridProps) {
  const media = useMedia();
  const columns = media.wide ? 4 : media.desktop ? 3 : media.tablet ? 3 : 2;
  const normalizedColumns = media.mobile && products.length <= 1 ? 1 : columns;
  const rows: Array<Array<ProductCardModel | null>> = [];

  for (let index = 0; index < (loading ? 8 : products.length); index += normalizedColumns) {
    if (loading) {
      rows.push(Array.from({ length: normalizedColumns }, () => null));
    } else {
      rows.push([...products].slice(index, index + normalizedColumns));
    }
  }

  return (
    <YStack gap={mobileSpacing[5]}>
      {rows.map((row, rowIndex) => (
        <XStack key={rowIndex} gap={mobileSpacing[3]} flexWrap="nowrap">
          {row.map((item, columnIndex) => (
            <YStack key={item?.id ?? `${rowIndex}-${columnIndex}`} flex={1}>
              {item ? <ProductCard product={item} /> : <LoadingProductCard />}
            </YStack>
          ))}
          {row.length < normalizedColumns
            ? Array.from({ length: normalizedColumns - row.length }).map((_, fillerIndex) => (
                <YStack key={`filler-${rowIndex}-${fillerIndex}`} flex={1} />
              ))
            : null}
        </XStack>
      ))}
    </YStack>
  );
}
