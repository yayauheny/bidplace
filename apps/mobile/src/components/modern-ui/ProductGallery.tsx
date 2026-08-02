import { Image } from 'expo-image';
import { ScrollView } from 'react-native';
import { useState } from 'react';

import { modernTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { ImagePlaceholder } from './ImagePlaceholder';

type ProductGalleryImage = { id: string; url: string };

export function ProductGallery({
  images,
  label,
}: {
  images: ProductGalleryImage[];
  label: string;
}) {
  if (images.length === 0)
    return (
      <ImagePlaceholder
        ratio={modernTokens.ratio.productPortrait}
        label={`Нет изображения: ${label}`}
      />
    );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: modernTokens.space.x3 }}
      accessibilityLabel={`Галерея: ${label}`}
    >
      {images.map((image) => (
        <GalleryImage key={image.id} image={image} label={label} />
      ))}
    </ScrollView>
  );
}

function GalleryImage({
  image,
  label,
}: {
  image: ProductGalleryImage;
  label: string;
}) {
  const [failed, setFailed] = useState(false);
  const imageLabel = `Изображение предмета: ${label}`;

  if (failed) {
    return (
      <ImagePlaceholder
        ratio={modernTokens.ratio.productPortrait}
        label={`Изображение недоступно: ${label}`}
        style={{ width: 300 }}
      />
    );
  }

  return (
    <Image
      source={{ uri: getApiAssetUrl(image.url) }}
      contentFit="contain"
      transition={modernTokens.motion.fast}
      accessibilityLabel={imageLabel}
      onError={() => setFailed(true)}
      style={{
        width: 300,
        aspectRatio: modernTokens.ratio.productPortrait,
        borderRadius: modernTokens.radius.image,
        backgroundColor: modernTokens.color.placeholder,
      }}
    />
  );
}
