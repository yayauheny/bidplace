import { Image } from 'expo-image';
import { useEffect, useState } from 'react';

import { resolveMediaUrl } from '../../lib/media';
import { useApiClient } from '../../providers/api-provider';
import { mobileRadius } from '../../theme/tokens';
import { EmptyState } from '../ui';
import { YStack } from 'tamagui';
import { useAppThemePalette } from '../../theme/palette';

type AuctionGalleryProps = {
  title: string;
  imageUrls: Array<string>;
};

export function AuctionGallery({ title, imageUrls }: AuctionGalleryProps) {
  const api = useApiClient();
  const palette = useAppThemePalette();
  const image = imageUrls[0];
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  if (!image || imageFailed) {
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
        source={{ uri: resolveMediaUrl(image, api.baseUrl) }}
        accessibilityLabel={title}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
        onError={() => setImageFailed(true)}
      />
    </YStack>
  );
}
