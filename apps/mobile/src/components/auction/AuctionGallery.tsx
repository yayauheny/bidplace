import { Image } from 'react-native';

import { mobileRadius } from '../../theme/tokens';
import { EmptyState } from '../ui';
import { YStack } from 'tamagui';
import { useAppThemePalette } from '../../theme/palette';

type AuctionGalleryProps = {
  title: string;
  imageUrls: Array<string>;
};

export function AuctionGallery({ title, imageUrls }: AuctionGalleryProps) {
  const palette = useAppThemePalette();
  const image = imageUrls[0];

  if (!image) {
    return (
      <EmptyState
        title="Изображение отсутствует"
        description="Продавец пока не добавил фото лота."
      />
    );
  }

  return (
    <YStack
      style={{
        overflow: 'hidden',
        borderRadius: mobileRadius.lg,
        aspectRatio: 4 / 3,
        backgroundColor: palette.surfaceMuted,
      }}
    >
      <Image
        source={{ uri: image }}
        accessibilityLabel={title}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </YStack>
  );
}
