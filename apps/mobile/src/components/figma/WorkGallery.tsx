import { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { productMediaStyle } from '../ui/product-media-style';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import {
  orderedWorkGalleryImages,
  type WorkGalleryImage,
} from './work-gallery';

export function WorkGallery({
  images,
  label,
}: {
  images: readonly WorkGalleryImage[];
  label: string;
}) {
  const ordered = orderedWorkGalleryImages(images);
  if (ordered.length === 0) return null;

  return (
    <View
      accessibilityLabel={`Галерея: ${label}`}
      style={{ gap: figmaTokens.space.x2 }}
    >
      {ordered.map((image) => (
        <ResilientRemoteImage
          key={image.id}
          uri={getApiAssetUrl(image.url)}
          component="WorkGallery"
          accessibilityLabel={label}
          fallbackLabel={`Изображение недоступно: ${label}`}
          contentFit="cover"
          style={[productMediaStyle(), { overflow: 'hidden' }]}
        />
      ))}
    </View>
  );
}
