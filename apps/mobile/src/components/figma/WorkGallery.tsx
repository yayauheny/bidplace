import { useRef, useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { ResilientRemoteImage } from '../ui';
import { getApiAssetUrl } from '../../lib/environment';
import { useReducedMotion } from '../../lib/reduced-motion';
import { FigmaIconButton } from './FigmaIconButton';

type GalleryImage = { id: string; url: string };
export function WorkGallery({
  images,
  label,
  action,
}: {
  images: readonly GalleryImage[];
  label: string;
  action?: ReactNode;
}) {
  const [width, setWidth] = useState<number>(designTokens.layout.phoneWidth);
  const [active, setActive] = useState(0);
  const scroll = useRef<ScrollView>(null);
  const reduced = useReducedMotion();
  const show = (index: number) => {
    setActive(index);
    scroll.current?.scrollTo({ x: width * index, animated: !reduced });
  };
  return (
    <View
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        setWidth(next);
        scroll.current?.scrollTo({ x: next * active, animated: false });
      }}
      style={{ gap: designTokens.space.x3 }}
    >
      <View
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
            <ResilientRemoteImage
              key={image.id}
              uri={getApiAssetUrl(image.url)}
              component="ProductGallery"
              accessibilityLabel={`${label}, фото ${index + 1} из ${images.length}`}
              fallbackLabel="Изображение недоступно"
              style={{ width, aspectRatio: designTokens.ratio.productPortrait }}
            />
          ))}
        </ScrollView>
        {action ? (
          <View
            style={{
              position: 'absolute',
              top: designTokens.space.x3,
              right: designTokens.space.x3,
            }}
          >
            {action}
          </View>
        ) : null}
        {images.length > 1 ? (
          <View
            style={{
              position: 'absolute',
              bottom: designTokens.space.x3,
              left: designTokens.space.x3,
              right: designTokens.space.x3,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <FigmaIconButton
              icon="arrow-left-01"
              label="Предыдущее фото"
              disabled={active === 0}
              onPress={() => show(active - 1)}
            />
            <FigmaIconButton
              icon="arrow-right-01"
              label="Следующее фото"
              disabled={active === images.length - 1}
              onPress={() => show(active + 1)}
            />
          </View>
        ) : null}
      </View>
      {images.length > 1 ? (
        <View
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
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  index === active
                    ? designTokens.color.ink
                    : designTokens.color.divider,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
