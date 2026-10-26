import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { CropZoom, type CropZoomRefType } from 'react-native-zoom-toolkit';
import { designTokens } from '@bidplace/design-tokens';
import { useAppTheme } from '../../providers/theme-provider';
import type { PhotoCropSurfaceProps } from './photo-crop-surface';
import { originalPhotoEdit, transformedPhotoSize } from './photo-edit';

export function PhotoCropSurface({
  ref,
  uri,
  width,
  height,
  viewportWidth,
  viewportHeight,
  openingCrop,
  cropEnabled,
  avatar,
  onChange,
}: PhotoCropSurfaceProps) {
  const palette = useAppTheme();
  const zoom = useRef<CropZoomRefType>(null);
  const [previewEdit, setPreviewEdit] = useState(originalPhotoEdit);
  const ratio = avatar
    ? 1
    : openingCrop
      ? (width * openingCrop.width) / (height * openingCrop.height)
      : width / height;
  const initialWidth = Math.min(
    viewportWidth - 64,
    (viewportHeight - 64) * ratio,
  );
  const [frame, setFrame] = useState({
    width: initialWidth,
    height: initialWidth / ratio,
  });
  useEffect(() => {
    if (!openingCrop || !zoom.current) return;
    const state = zoom.current.getState();
    const base = state.childSize.width / width;
    const scale = frame.width / (openingCrop.width * width * base);
    zoom.current.setTransformState(
      {
        ...state,
        scale,
        translateX:
          (0.5 - openingCrop.x - openingCrop.width / 2) * width * base * scale,
        translateY:
          (0.5 - openingCrop.y - openingCrop.height / 2) *
          height *
          base *
          scale,
      },
      false,
    );
  }, []);
  const getEdit = () => {
    const result = zoom.current?.crop();
    const rotate = result
      ? (((Math.round(result.context.rotationAngle / 90) * 90) % 360) + 360) %
        360
      : 0;
    const size = transformedPhotoSize(width, height, rotate);
    return {
      rotate,
      flipHorizontal: result?.context.flipHorizontal ?? false,
      flipVertical: result?.context.flipVertical ?? false,
      crop:
        cropEnabled && result
          ? {
              x: Math.max(0, result.crop.originX / size.width),
              y: Math.max(0, result.crop.originY / size.height),
              width:
                Math.min(result.crop.width, size.width - result.crop.originX) /
                size.width,
              height:
                Math.min(
                  result.crop.height,
                  size.height - result.crop.originY,
                ) / size.height,
            }
          : null,
    };
  };
  useImperativeHandle(ref, () => ({
    getEdit,
    rotate: () => {
      zoom.current?.rotate(false);
      setPreviewEdit(getEdit());
      onChange?.(getEdit());
    },
    flip: () => {
      zoom.current?.flipHorizontal(false);
      setPreviewEdit(getEdit());
      onChange?.(getEdit());
    },
  }));
  const resize = (x: number, y: number) =>
    setFrame({
      width: Math.max(44, Math.min(viewportWidth - 16, x)),
      height: Math.max(44, Math.min(viewportHeight - 16, y)),
    });
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Кадр фотографии. Перемещайте фото и изменяйте масштаб."
      accessibilityActions={[
        { name: 'increment', label: 'Увеличить масштаб' },
        { name: 'decrement', label: 'Уменьшить масштаб' },
        { name: 'left', label: 'Сдвинуть влево' },
        { name: 'right', label: 'Сдвинуть вправо' },
        { name: 'up', label: 'Сдвинуть вверх' },
        { name: 'down', label: 'Сдвинуть вниз' },
      ]}
      onAccessibilityAction={({ nativeEvent }) => {
        if (!zoom.current) return;
        const state = zoom.current.getState(),
          action = nativeEvent.actionName;
        zoom.current.setTransformState(
          {
            ...state,
            scale:
              state.scale *
              (action === 'increment'
                ? 1.1
                : action === 'decrement'
                  ? 1 / 1.1
                  : 1),
            translateX:
              state.translateX +
              (action === 'right' ? 10 : action === 'left' ? -10 : 0),
            translateY:
              state.translateY +
              (action === 'down' ? 10 : action === 'up' ? -10 : 0),
          },
          false,
        );
      }}
    >
      <View
        pointerEvents={cropEnabled ? 'auto' : 'none'}
        style={{ flex: 1, opacity: cropEnabled ? 1 : 0 }}
      >
        <CropZoom
          ref={zoom}
          cropSize={frame}
          resolution={{ width, height }}
          onGestureEnd={() => onChange?.(getEdit())}
          panMode="clamp"
          scaleMode="clamp"
          OverlayComponent={() => (
            <View
              pointerEvents="none"
              style={{
                width: viewportWidth,
                height: viewportHeight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Svg
                width={viewportWidth}
                height={viewportHeight}
                style={{ position: 'absolute' }}
              >
                <Path
                  fill={palette.overlayScrim}
                  fillRule="evenodd"
                  d={
                    `M0 0H${viewportWidth}V${viewportHeight}H0Z ` +
                    (avatar
                      ? `M${viewportWidth / 2 - frame.width / 2} ${viewportHeight / 2}a${frame.width / 2} ${frame.width / 2} 0 1 0 ${frame.width} 0a${frame.width / 2} ${frame.width / 2} 0 1 0 -${frame.width} 0Z`
                      : `M${(viewportWidth - frame.width) / 2} ${(viewportHeight - frame.height) / 2}h${frame.width}v${frame.height}h-${frame.width}Z`)
                  }
                />
              </Svg>
              <View
                style={{
                  width: frame.width,
                  height: frame.height,
                  borderWidth: 2,
                  borderColor: palette.white,
                  borderRadius: avatar ? frame.width / 2 : 1,
                }}
              />
            </View>
          )}
        >
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </CropZoom>
      </View>
      {!cropEnabled ? (
        <Image
          source={{ uri }}
          resizeMode="contain"
          accessibilityLabel="Полный вид фотографии"
          style={{
            position: 'absolute',
            width:
              width *
              Math.min(
                viewportWidth /
                  transformedPhotoSize(width, height, previewEdit.rotate).width,
                viewportHeight /
                  transformedPhotoSize(width, height, previewEdit.rotate)
                    .height,
              ),
            height:
              height *
              Math.min(
                viewportWidth /
                  transformedPhotoSize(width, height, previewEdit.rotate).width,
                viewportHeight /
                  transformedPhotoSize(width, height, previewEdit.rotate)
                    .height,
              ),
            transform: [
              { rotate: `${previewEdit.rotate}deg` },
              { scaleX: previewEdit.flipHorizontal ? -1 : 1 },
              { scaleY: previewEdit.flipVertical ? -1 : 1 },
            ],
          }}
        />
      ) : null}
      {!avatar && cropEnabled
        ? [-1, 1].flatMap((x) =>
            [-1, 1].map((y) => (
              <GestureDetector
                key={`${x}:${y}`}
                gesture={Gesture.Pan().onEnd((event) => {
                  runOnJS(resize)(
                    frame.width + event.translationX * x * 2,
                    frame.height + event.translationY * y * 2,
                  );
                })}
              >
                <View
                  accessible
                  accessibilityRole="adjustable"
                  accessibilityLabel="Размер рамки кадрирования"
                  accessibilityActions={[
                    { name: 'increment' },
                    { name: 'decrement' },
                  ]}
                  onAccessibilityAction={({ nativeEvent }) =>
                    resize(
                      frame.width +
                        (nativeEvent.actionName === 'increment' ? 10 : -10),
                      frame.height +
                        (nativeEvent.actionName === 'increment' ? 10 : -10),
                    )
                  }
                  style={{
                    position: 'absolute',
                    width: designTokens.size.touch,
                    height: designTokens.size.touch,
                    left: viewportWidth / 2 + (frame.width * x) / 2 - 22,
                    top: viewportHeight / 2 + (frame.height * y) / 2 - 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: palette.white,
                    }}
                  />
                </View>
              </GestureDetector>
            )),
          )
        : null}
    </View>
  );
}
