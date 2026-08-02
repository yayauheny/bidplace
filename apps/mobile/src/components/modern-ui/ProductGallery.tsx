import { Image } from 'expo-image';
import { ScrollView, useWindowDimensions } from 'react-native';
import { useState } from 'react';

import { modernTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { getMotionDuration, useReducedMotion } from '../../lib/reduced-motion';
import { ImagePlaceholder } from './ImagePlaceholder';

type ProductGalleryImage = { id: string; url: string };

export function ProductGallery({
  images,
  label,
}: {
  images: ProductGalleryImage[];
  label: string;
}) {
  const { width } = useWindowDimensions();
  const imageWidth =
    width >= modernTokens.breakpoint.productDetailWide
      ? modernTokens.productHeroWide
      : 300;

  if (images.length === 0)
    return (
      <ImagePlaceholder
        ratio={modernTokens.ratio.productPortrait}
        label={`Нет изображения: ${label}`}
        style={{ width: imageWidth, alignSelf: 'center' }}
      />
    );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        minWidth: '100%',
        gap: modernTokens.space.x3,
        justifyContent: images.length === 1 ? 'center' : 'flex-start',
      }}
      accessibilityLabel={`Галерея: ${label}`}
    >
      {images.map((image) => (
        <GalleryImage
          key={image.id}
          image={image}
          label={label}
          width={imageWidth}
        />
      ))}
    </ScrollView>
  );
}

function GalleryImage({
  image,
  label,
  width,
}: {
  image: ProductGalleryImage;
  label: string;
  width: number;
}) {
  const [failed, setFailed] = useState(false);
  const reducedMotion = useReducedMotion();
  const imageLabel = `Изображение предмета: ${label}`;

  if (failed) {
    return (
      <ImagePlaceholder
        ratio={modernTokens.ratio.productPortrait}
        label={`Изображение недоступно: ${label}`}
        style={{ width }}
      />
    );
  }

  return (
    <Image
      source={{ uri: getApiAssetUrl(image.url) }}
      contentFit="contain"
      transition={getMotionDuration(reducedMotion, modernTokens.motion.fast)}
      accessibilityLabel={imageLabel}
      onError={() => setFailed(true)}
      style={{
        width,
        aspectRatio: modernTokens.ratio.productPortrait,
        borderRadius: modernTokens.radius.image,
        backgroundColor: modernTokens.color.placeholder,
      }}
    />
  );
}
