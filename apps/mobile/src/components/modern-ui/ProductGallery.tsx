import { Image } from 'expo-image';
import { ScrollView } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { getApiUrl } from '../../lib/environment';
import { ImagePlaceholder } from './ImagePlaceholder';

type ProductGalleryImage = { id: string; url: string };

export function ProductGallery({ images, label }: { images: ProductGalleryImage[]; label: string }) {
  if (images.length === 0) return <ImagePlaceholder ratio={4 / 5} label={`Нет изображения: ${label}`} />;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: modernTokens.space.x3 }} accessibilityLabel={`Галерея: ${label}`}>
      {images.map((image) => <Image key={image.id} source={{ uri: `${getApiUrl()}${image.url}` }} contentFit="cover" transition={modernTokens.motion.fast} accessibilityLabel={label} style={{ width: 300, aspectRatio: 4 / 5, borderRadius: modernTokens.radius.image, backgroundColor: modernTokens.color.placeholder }} />)}
    </ScrollView>
  );
}
