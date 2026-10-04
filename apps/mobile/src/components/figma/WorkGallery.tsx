import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import {
  AppDialog,
  MotionPressable,
  ResilientRemoteImage,
  SecondaryButton,
} from '../ui';
import { getApiAssetUrl } from '../../lib/environment';
import { useReducedMotion } from '../../lib/reduced-motion';
import { FigmaGlassSurface } from './FigmaGlassSurface';
import { FigmaIconButton } from './FigmaIconButton';
import { workGalleryShowsArrows } from './work-gallery-arrows';
import {
  workGalleryChromeStyle,
  workGalleryDotStyle,
} from './work-gallery-chrome';

type GalleryImage = {
  id: string;
  url: string;
  full?: { url: string; width: number | null; height: number | null };
};
export function WorkGallery({
  images,
  label,
  leadingAction,
  action,
}: {
  images: readonly [GalleryImage, ...GalleryImage[]];
  label: string;
  leadingAction?: ReactNode;
  action?: ReactNode;
}) {
  const [width, setWidth] = useState<number>(designTokens.layout.phoneWidth);
  const [active, setActive] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const viewerImage =
    viewerIndex === null
      ? null
      : images[Math.min(viewerIndex, images.length - 1)];
  const scroll = useRef<ScrollView>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const page = Math.min(active, images.length - 1);
    if (page !== active) {
      setActive(page);
      scroll.current?.scrollTo({ x: width * page, animated: false });
    }
  }, [active, images.length, width]);
  const show = (index: number) => {
    const page = Math.max(0, Math.min(images.length - 1, index));
    setActive(page);
    scroll.current?.scrollTo({ x: width * page, animated: !reduced });
  };
  const showArrows = images.length > 1 && workGalleryShowsArrows(width);
  return (
    <View
      testID="work-gallery"
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        setWidth(next);
        scroll.current?.scrollTo({ x: next * active, animated: false });
      }}
      style={{ gap: designTokens.space.x3 }}
    >
      <View
        testID="work-gallery-media"
        style={{
          overflow: 'hidden',
          borderBottomLeftRadius: designTokens.radius.workGallery,
          borderBottomRightRadius: designTokens.radius.workGallery,
        }}
      >
        <ScrollView
          ref={scroll}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(event) =>
            setActive(
              Math.max(
                0,
                Math.min(
                  images.length - 1,
                  Math.round(event.nativeEvent.contentOffset.x / width),
                ),
              ),
            )
          }
        >
          {images.map((image, index) => (
            <MotionPressable
              key={image.id}
              accessibilityRole="button"
              accessibilityLabel={`Открыть фото ${index + 1}`}
              onPress={() => setViewerIndex(index)}
            >
              <ResilientRemoteImage
                uri={getApiAssetUrl(image.url)}
                component="ProductGallery"
                accessibilityLabel={`${label}, фото ${index + 1} из ${images.length}`}
                fallbackLabel="Изображение недоступно"
                style={{
                  width,
                  aspectRatio: designTokens.ratio.productPortrait,
                }}
              />
            </MotionPressable>
          ))}
        </ScrollView>
        {showArrows ? (
          <View
            testID="work-gallery-arrows"
            style={{
              position: 'absolute',
              bottom: designTokens.space.x3,
              left: designTokens.space.x3,
              right: designTokens.space.x3,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <FigmaGlassSurface preset="controlGroup">
              <FigmaIconButton
                icon="arrow-left-01"
                label="Предыдущее фото"
                disabled={active === 0}
                onPress={() => show(active - 1)}
              />
            </FigmaGlassSurface>
            <FigmaGlassSurface preset="controlGroup">
              <FigmaIconButton
                icon="arrow-right-01"
                label="Следующее фото"
                disabled={active === images.length - 1}
                onPress={() => show(active + 1)}
              />
            </FigmaGlassSurface>
          </View>
        ) : null}
      </View>
      {leadingAction || action ? (
        <View testID="work-gallery-chrome" style={workGalleryChromeStyle()}>
          {leadingAction ?? <View />}
          {action ?? <View />}
        </View>
      ) : null}
      {viewerImage && viewerIndex !== null ? (
        <AppDialog
          open
          title={`${label}, фото ${viewerIndex + 1} из ${images.length}`}
          onClose={() => setViewerIndex(null)}
        >
          <ResilientRemoteImage
            uri={getApiAssetUrl(viewerImage.full?.url ?? viewerImage.url)}
            component="ProductGallery"
            accessibilityLabel={`${label}, увеличенное фото`}
            fallbackLabel="Изображение недоступно"
            contentFit="contain"
            style={{
              width: '100%',
              aspectRatio: designTokens.ratio.productPortrait,
            }}
          />
          {images.length > 1 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: designTokens.space.x3 }}>
              <SecondaryButton
                label="Предыдущее фото в просмотре"
                disabled={viewerIndex === 0}
                onPress={() => setViewerIndex(viewerIndex - 1)}
              />
              <SecondaryButton
                label="Следующее фото в просмотре"
                disabled={viewerIndex >= images.length - 1}
                onPress={() => setViewerIndex(viewerIndex + 1)}
              />
            </View>
          ) : null}
        </AppDialog>
      ) : null}
      {images.length > 1 ? (
        <View
          testID="work-gallery-dots"
          accessible
          accessibilityLabel={`Фото ${active + 1} из ${images.length}`}
          accessibilityLiveRegion="polite"
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: designTokens.space.x2,
          }}
        >
          {images.map((image, index) => (
            <View
              key={image.id}
              style={workGalleryDotStyle(index === active)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
