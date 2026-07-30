import { Image } from 'expo-image';
import { ScrollView } from 'react-native';
import { useState } from 'react';

import { modernTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { ImagePlaceholder } from './ImagePlaceholder';

type ProductGalleryImage = { id: string; url: string };

export function ProductGallery({ images, label }: { images: ProductGalleryImage[]; label: string }) {
  if (images.length === 0) return <ImagePlaceholder ratio={4 / 5} label={`Нет изображения: ${label}`} />;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: modernTokens.space.x3 }} accessibilityLabel={`Галерея: ${label}`}>
      {images.map((image) => <GalleryImage key={image.id} image={image} label={label} />)}
    </ScrollView>
  );
}

function GalleryImage({ image, label }: { image: ProductGalleryImage; label: string }) {
  const [failed, setFailed] = useState(false);
  const imageLabel = `Изображение предмета: ${label}`;

  if (failed) {
    return <ImagePlaceholder ratio={4 / 5} label={`Изображение недоступно: ${label}`} style={{ width: 300 }} />;
  }

  return (
    <Image
      source={{ uri: getApiAssetUrl(image.url) }}
      contentFit="cover"
      transition={modernTokens.motion.fast}
      accessibilityLabel={imageLabel}
      onError={() => setFailed(true)}
      style={{ width: 300, aspectRatio: 4 / 5, borderRadius: modernTokens.radius.image, backgroundColor: modernTokens.color.placeholder }}
    />
  );
}
