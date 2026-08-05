import { ScrollView, useWindowDimensions } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { getMotionDuration, useReducedMotion } from '../../lib/reduced-motion';
import { ImagePlaceholder } from './ImagePlaceholder';
import { productMediaStyle } from './product-media-style';
import { ResilientRemoteImage } from './ResilientRemoteImage';

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
  const reducedMotion = useReducedMotion();
  const imageLabel = `Изображение предмета: ${label}`;

  return (
    <ResilientRemoteImage
      uri={getApiAssetUrl(image.url)}
      component="ProductGallery"
      accessibilityLabel={imageLabel}
      fallbackLabel={`Изображение недоступно: ${label}`}
      style={productMediaStyle(width)}
      contentFit="contain"
      transition={getMotionDuration(reducedMotion, modernTokens.motion.fast)}
    />
  );
}
