import { ScrollView, useWindowDimensions } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { getMotionDuration, useReducedMotion } from '../../lib/reduced-motion';
import { ImagePlaceholder } from './ImagePlaceholder';
import { productMediaStyle } from './product-media-style';
import { ResilientRemoteImage } from './ResilientRemoteImage';

type ProductGalleryImage = {
  id: string;
  url: string;
  width?: number | null;
  height?: number | null;
};

const desktopGalleryHeight = 514;
const desktopGalleryMaxWidth = 420;

function getDesktopImageSize(image: ProductGalleryImage) {
  if (!image.width || !image.height) {
    return { width: 360, height: desktopGalleryHeight };
  }

  const aspectRatio = image.width / image.height;
  const width = Math.min(
    desktopGalleryMaxWidth,
    Math.round(desktopGalleryHeight * aspectRatio),
  );
  return { width, height: Math.round(width / aspectRatio) };
}

export function ProductGallery({
  images,
  label,
}: {
  images: ProductGalleryImage[];
  label: string;
}) {
  const { width } = useWindowDimensions();
  const imageWidth =
    width >= designTokens.breakpoint.productHeroThreeColumn
      ? 520
      : width >= designTokens.breakpoint.productDetailWide
        ? designTokens.productHeroWide
        : 300;

  if (images.length === 0)
    return (
      <ImagePlaceholder
        ratio={designTokens.ratio.productPortrait}
        label={`Нет изображения: ${label}`}
        style={{
          width:
            width >= designTokens.breakpoint.productHeroThreeColumn
              ? 360
              : imageWidth,
          height:
            width >= designTokens.breakpoint.productHeroThreeColumn
              ? desktopGalleryHeight
              : undefined,
          alignSelf: 'center',
        }}
      />
    );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        minWidth: '100%',
        gap: designTokens.space.x3,
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
          desktop={width >= designTokens.breakpoint.productHeroThreeColumn}
        />
      ))}
    </ScrollView>
  );
}

function GalleryImage({
  image,
  label,
  width,
  desktop,
}: {
  image: ProductGalleryImage;
  label: string;
  width: number;
  desktop: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const imageLabel = `Изображение предмета: ${label}`;
  const desktopSize = desktop ? getDesktopImageSize(image) : undefined;

  return (
    <ResilientRemoteImage
      uri={getApiAssetUrl(image.url)}
      component="ProductGallery"
      accessibilityLabel={imageLabel}
      fallbackLabel={`Изображение недоступно: ${label}`}
      style={
        desktop
          ? {
              width: desktopSize!.width,
              height: desktopSize!.height,
              borderRadius: designTokens.radius.media,
              backgroundColor: designTokens.color.placeholder,
            }
          : productMediaStyle(width)
      }
      contentFit="contain"
      transition={getMotionDuration(reducedMotion, designTokens.motion.fast)}
    />
  );
}
