import { useState, type ComponentProps } from 'react';
import { View } from 'react-native';
import {
  transformedPhotoSize,
  type PhotoEdit,
} from '../../lib/media/photo-edit';
import type { PhotoCrop } from '@bidplace/contracts';
import { ResilientRemoteImage } from '../ui';

export function croppedPhotoGeometry(
  crop: PhotoCrop,
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
) {
  const scale = Math.max(
    width / (sourceWidth * crop.width),
    height / (sourceHeight * crop.height),
  );
  return {
    width: sourceWidth * scale,
    height: sourceHeight * scale,
    left:
      (width - crop.width * sourceWidth * scale) / 2 -
      crop.x * sourceWidth * scale,
    top:
      (height - crop.height * sourceHeight * scale) / 2 -
      crop.y * sourceHeight * scale,
  };
}
export function CroppedPhoto({
  crop,
  sourceWidth: suppliedWidth,
  sourceHeight: suppliedHeight,
  orientation,
  style,
  ...props
}: ComponentProps<typeof ResilientRemoteImage> & {
  crop?: PhotoCrop | null;
  orientation?: PhotoEdit;
  sourceWidth?: number | null;
  sourceHeight?: number | null;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [natural, setNatural] = useState({ uri: '', width: 0, height: 0 });
  const sourceWidth =
    suppliedWidth ?? (natural.uri === props.uri ? natural.width : 0);
  const sourceHeight =
    suppliedHeight ?? (natural.uri === props.uri ? natural.height : 0);
  if (!crop || !sourceWidth || !sourceHeight)
    return (
      <ResilientRemoteImage
        {...props}
        style={style}
        onDimensions={(value) => setNatural({ uri: props.uri, ...value })}
      />
    );
  const transformed = transformedPhotoSize(
    sourceWidth,
    sourceHeight,
    orientation?.rotate ?? 0,
  );
  const geometry = croppedPhotoGeometry(
    crop,
    transformed.width,
    transformed.height,
    size.width,
    size.height,
  );
  const scale = geometry.width / transformed.width;
  const imageStyle = orientation
    ? {
        width: sourceWidth * scale,
        height: sourceHeight * scale,
        left: geometry.left + geometry.width / 2 - (sourceWidth * scale) / 2,
        top: geometry.top + geometry.height / 2 - (sourceHeight * scale) / 2,
        transform: [
          { rotate: `${orientation.rotate}deg` },
          { scaleX: orientation.flipHorizontal ? -1 : 1 },
          { scaleY: orientation.flipVertical ? -1 : 1 },
        ],
      }
    : geometry;
  return (
    <View
      onLayout={({ nativeEvent }) => setSize(nativeEvent.layout)}
      style={[style, { overflow: 'hidden' }]}
    >
      {size.width > 0 && size.height > 0 ? (
        <ResilientRemoteImage
          {...props}
          contentFit="fill"
          style={{ position: 'absolute', ...imageStyle }}
        />
      ) : null}
    </View>
  );
}
