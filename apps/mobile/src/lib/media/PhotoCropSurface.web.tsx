import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Cropper,
  CircleStencil,
  type CropperRef,
} from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import './photo-crop-surface.css';
import type { PhotoCropSurfaceProps } from './photo-crop-surface';
import { originalPhotoEdit, transformedPhotoSize } from './photo-edit';
import { useAppTheme } from '../../providers/theme-provider';

export function PhotoCropSurface({
  ref,
  uri,
  width,
  height,
  openingCrop,
  cropEnabled,
  avatar,
  viewportWidth,
  viewportHeight,
  onChange,
}: PhotoCropSurfaceProps) {
  const palette = useAppTheme();
  const cropper = useRef<CropperRef>(null);
  const [edit, setEdit] = useState(originalPhotoEdit);
  const readTransforms = () => {
    const value = cropper.current?.getTransforms();
    return value
      ? {
          rotate: (((Math.round(value.rotate / 90) * 90) % 360) + 360) % 360,
          flipHorizontal: value.flip.horizontal,
          flipVertical: value.flip.vertical,
          crop: null,
        }
      : originalPhotoEdit;
  };
  const getEdit = () => {
    const transforms = readTransforms(),
      coordinates = cropper.current?.getCoordinates();
    const size = transformedPhotoSize(width, height, transforms.rotate);
    return {
      ...transforms,
      crop:
        cropEnabled && coordinates
          ? {
              x: Math.max(0, coordinates.left / size.width),
              y: Math.max(0, coordinates.top / size.height),
              width:
                Math.min(size.width - coordinates.left, coordinates.width) /
                size.width,
              height:
                Math.min(size.height - coordinates.top, coordinates.height) /
                size.height,
            }
          : null,
    };
  };
  useEffect(() => {
    onChange?.(getEdit());
  }, [cropEnabled]);
  useImperativeHandle(ref, () => ({
    getEdit,
    rotate: () => {
      cropper.current?.rotateImage(90);
      setEdit(readTransforms());
    },
    flip: () => {
      cropper.current?.flipImage(true, false);
      setEdit(readTransforms());
    },
  }));
  const size = transformedPhotoSize(width, height, edit.rotate);
  const scale = Math.min(
    viewportWidth / size.width,
    viewportHeight / size.height,
  );
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        role="group"
        aria-label="Кадрирование: стрелки — перемещение, Alt и стрелки — размер, плюс и минус — масштаб"
        tabIndex={0}
        style={{
          width: '100%',
          height: '100%',
          visibility: cropEnabled ? 'visible' : 'hidden',
          touchAction: 'none',
        }}
        onKeyDown={(event) => {
          const instance = cropper.current,
            coordinates = instance?.getCoordinates();
          if (!instance || !coordinates) return;
          const step = event.shiftKey ? 10 : 1;
          const delta = {
            ArrowLeft: { left: -step },
            ArrowRight: { left: step },
            ArrowUp: { top: -step },
            ArrowDown: { top: step },
          }[event.key];
          if (delta) {
            event.preventDefault();
            if (event.altKey)
              instance.setCoordinates({
                width: Math.max(1, coordinates.width + (delta.left ?? 0)),
                height: Math.max(1, coordinates.height + (delta.top ?? 0)),
              });
            else instance.moveCoordinates(delta);
          } else if (event.key === '+' || event.key === '-') {
            event.preventDefault();
            instance.zoomImage(event.key === '+' ? 1.1 : 1 / 1.1);
          }
        }}
      >
        <Cropper
          ref={cropper}
          src={uri}
          transitions={false}
          className={
            avatar ? 'photo-cropper photo-cropper--avatar' : 'photo-cropper'
          }
          style={{
            height: '100%',
            background: 'transparent',
            ...(avatar ? { color: palette.surfaceStrong } : {}),
          }}
          {...(avatar ? { stencilComponent: CircleStencil } : {})}
          defaultSize={(state) => {
            // Initial frame proportions from 7330:729 / 7332:715; saved crop wins below.
            const area = state.visibleArea ?? { width, height };
            return avatar
              ? {
                  width: (area.width * 308) / 366,
                  height: (area.height * 308) / 418,
                }
              : {
                  width: (area.height * 302) / 436,
                  height: (area.height * 368) / 436,
                };
          }}
          defaultCoordinates={
            openingCrop
              ? {
                  left: openingCrop.x * width,
                  top: openingCrop.y * height,
                  width: openingCrop.width * width,
                  height: openingCrop.height * height,
                }
              : undefined
          }
          stencilProps={
            avatar
              ? {
                  aspectRatio: 1,
                  resizable: false,
                  grid: false,
                  handlers: {
                    north: false,
                    south: false,
                    east: false,
                    west: false,
                    eastNorth: false,
                    westNorth: false,
                    eastSouth: false,
                    westSouth: false,
                  },
                  lines: {
                    north: false,
                    south: false,
                    east: false,
                    west: false,
                  },
                }
              : {
                  handlers: {
                    eastNorth: true,
                    westNorth: true,
                    eastSouth: true,
                    westSouth: true,
                    north: false,
                    south: false,
                    east: false,
                    west: false,
                  },
                  grid: false,
                }
          }
          onChange={() => {
            setEdit(readTransforms());
            onChange?.(getEdit());
          }}
        />
      </div>
      {!cropEnabled ? (
        <img
          alt="Полный вид фотографии"
          src={uri}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: width * scale,
            height: height * scale,
            transform: `translate(-50%, -50%) rotate(${edit.rotate}deg) scaleX(${edit.flipHorizontal ? -1 : 1}) scaleY(${edit.flipVertical ? -1 : 1})`,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </div>
  );
}
