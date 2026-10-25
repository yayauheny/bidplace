import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ElementRef,
  type KeyboardEvent,
} from 'react';
import {
  Platform,
  ScrollView,
  View,
  type StyleProp,
  type ImageStyle,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import {
  AppDialog,
  MotionPressable,
  ResilientRemoteImage,
  SecondaryButton,
} from '../ui';
import { getApiAssetUrl } from '../../lib/environment';
import { useReducedMotion } from '../../lib/reduced-motion';
import { useAppTheme } from '../../providers/theme-provider';
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
  renderImage,
  thumbnails = false,
}: {
  images: readonly [GalleryImage, ...GalleryImage[]];
  label: string;
  leadingAction?: ReactNode;
  action?: ReactNode;
  thumbnails?: boolean;
  renderImage?: (
    image: GalleryImage,
    style: StyleProp<ImageStyle>,
  ) => ReactNode;
}) {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const viewerImage =
    viewerIndex === null
      ? null
      : images[Math.min(viewerIndex, images.length - 1)];
  const scroll = useRef<ScrollView>(null);
  const photoButtons = useRef<Array<ElementRef<typeof MotionPressable> | null>>(
    [],
  );
  const reduced = useReducedMotion();
  const palette = useAppTheme();
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
  const updateActivePhoto = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (width > 0)
      setActive(
        Math.max(
          0,
          Math.min(
            images.length - 1,
            Math.round(event.nativeEvent.contentOffset.x / width),
          ),
        ),
      );
  };

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
          onMomentumScrollEnd={updateActivePhoto}
          // RN Web emits scroll events instead of native momentum-end callbacks.
          onScroll={Platform.OS === 'web' ? updateActivePhoto : undefined}
          scrollEventThrottle={Platform.OS === 'web' ? 16 : undefined}
        >
          {images.map((image, index) => (
            <MotionPressable
              key={image.id}
              ref={(node) => {
                photoButtons.current[index] = node;
              }}
              {...(Platform.OS === 'web'
                ? {
                    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
                      if (
                        event.altKey ||
                        event.metaKey ||
                        event.ctrlKey ||
                        (event.key !== 'ArrowLeft' &&
                          event.key !== 'ArrowRight')
                      )
                        return;
                      event.preventDefault();
                      const next = Math.max(
                        0,
                        Math.min(
                          images.length - 1,
                          index + (event.key === 'ArrowRight' ? 1 : -1),
                        ),
                      );
                      show(next);
                      const button = photoButtons.current[next];
                      if (button instanceof HTMLElement)
                        button.focus({ preventScroll: true });
                    },
                  }
                : {})}
              accessibilityRole="button"
              accessibilityLabel={`Открыть фото ${index + 1}`}
              onPress={() => setViewerIndex(index)}
            >
              {renderImage ? (
                renderImage(image, {
                  width,
                  aspectRatio: designTokens.ratio.productPortrait,
                })
              ) : (
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
              )}
            </MotionPressable>
          ))}
        </ScrollView>
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
          {renderImage ? (
            renderImage(viewerImage, {
              width: '100%',
              aspectRatio: designTokens.ratio.productPortrait,
            })
          ) : (
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
          )}
          {images.length > 1 ? (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: designTokens.space.x3,
              }}
            >
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
      {thumbnails ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: designTokens.space.x2 }}
        >
          {images.map((image, index) => (
            <MotionPressable
              key={image.id}
              accessibilityRole="button"
              accessibilityLabel={`Фото ${index + 1}: выбрать`}
              accessibilityState={{ selected: active === index }}
              onPress={() => show(index)}
              style={{
                borderWidth: 1,
                borderColor: active === index ? palette.ink : palette.border,
                borderRadius: designTokens.radius.image,
                overflow: 'hidden',
              }}
            >
              {renderImage ? (
                renderImage(image, {
                  width: designTokens.size.control,
                  height: designTokens.size.control,
                })
              ) : (
                <ResilientRemoteImage
                  uri={getApiAssetUrl(image.url)}
                  component="ProductGallery"
                  accessibilityLabel={`Миниатюра ${index + 1}`}
                  fallbackLabel="Фото недоступно"
                  style={{
                    width: designTokens.size.control,
                    height: designTokens.size.control,
                  }}
                />
              )}
            </MotionPressable>
          ))}
        </ScrollView>
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
              style={workGalleryDotStyle(index === active, palette)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
