import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { productMediaStyle } from './product-media-style';
import { ResilientRemoteImage } from './ResilientRemoteImage';

type ProductGalleryImage = {
  id: string;
  url: string;
  width?: number | null;
  height?: number | null;
};

export function ProductGallery({
  images,
  label,
}: {
  images: [ProductGalleryImage, ...ProductGalleryImage[]];
  label: string;
}) {
  return (
    <View
      accessibilityLabel={`Галерея: ${label}`}
      style={{ gap: designTokens.space.x2 }}
    >
      {images.map((image) => (
        <ResilientRemoteImage
          key={image.id}
          uri={getApiAssetUrl(image.url)}
          component="ProductGallery"
          accessibilityLabel={label}
          fallbackLabel={`Изображение недоступно: ${label}`}
          contentFit="cover"
          style={[productMediaStyle(), { overflow: 'hidden' }]}
        />
      ))}
    </View>
  );
}
