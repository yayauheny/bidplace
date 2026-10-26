import type { PhotoCrop } from '@bidplace/contracts';
import { deleteGeneratedImage } from './temporary-image';
import { Platform } from 'react-native';
import {
  ImagePreparationError,
  readImageUpload,
  type ImageUploadInput,
} from './prepare-image-upload';

export type PhotoEdit = {
  rotate: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  crop: PhotoCrop | null;
};
export const originalPhotoEdit: PhotoEdit = {
  rotate: 0,
  flipHorizontal: false,
  flipVertical: false,
  crop: null,
};

export function transformedPhotoSize(
  width: number,
  height: number,
  rotate: number,
) {
  if (![0, 90, 180, 270].includes(rotate))
    throw new ImagePreparationError('PROCESSING_FAILED');
  return rotate % 180 ? { width: height, height: width } : { width, height };
}

export function photoPixelCrop(crop: PhotoCrop, width: number, height: number) {
  const originX = Math.max(0, Math.min(width - 1, Math.floor(crop.x * width)));
  const originY = Math.max(
    0,
    Math.min(height - 1, Math.floor(crop.y * height)),
  );
  return {
    originX,
    originY,
    width: Math.max(
      1,
      Math.min(width, Math.ceil((crop.x + crop.width) * width)) - originX,
    ),
    height: Math.max(
      1,
      Math.min(height, Math.ceil((crop.y + crop.height) * height)) - originY,
    ),
  };
}

export async function localPhotoBlob(blob: Blob) {
  if (Platform.OS === 'web') {
    const uri = URL.createObjectURL(blob);
    return { uri, dispose: () => URL.revokeObjectURL(uri) };
  }
  const { File, Paths } = await import('expo-file-system');
  const file = new File(
    Paths.cache,
    `photo-${crypto.randomUUID()}.${blob.type === 'image/png' ? 'png' : 'jpg'}`,
  );
  file.write(new Uint8Array(await blob.arrayBuffer()));
  return {
    uri: file.uri,
    dispose: () => {
      if (file.exists) file.delete();
    },
  };
}

export async function preparePhotoEdit(
  input: ImageUploadInput,
  edit: PhotoEdit,
  purpose: 'work' | 'avatar',
) {
  const source = await readImageUpload(input, 25 * 1024 * 1024);
  const transforms =
    edit.rotate !== 0 || edit.flipHorizontal || edit.flipVertical;
  if (!transforms && (purpose === 'work' || !edit.crop))
    return { input, blob: source, dispose: () => undefined };
  if (!input.width || !input.height)
    throw new ImagePreparationError('INVALID_DIMENSIONS');
  const { ImageManipulator, FlipType, SaveFormat } =
    await import('expo-image-manipulator');
  const context = ImageManipulator.manipulate(input.uri);
  let uri: string | undefined;
  try {
    // Both crop engines describe flips before rotation; crop is in transformed full-image coordinates.
    if (edit.flipHorizontal) context.flip(FlipType.Horizontal);
    if (edit.flipVertical) context.flip(FlipType.Vertical);
    if (edit.rotate) context.rotate(edit.rotate);
    const size = transformedPhotoSize(input.width, input.height, edit.rotate);
    if (purpose === 'avatar' && edit.crop)
      context.crop(photoPixelCrop(edit.crop, size.width, size.height));
    const rendered = await context.renderAsync();
    try {
      const png = ['image/png', 'image/webp'].includes(
        source.type || input.mimeType || '',
      );
      const result = await rendered.saveAsync({
        format: png ? SaveFormat.PNG : SaveFormat.JPEG,
        compress: 1,
      });
      uri = result.uri;
      const blob = await readImageUpload({ uri }, 25 * 1024 * 1024);
      const local = await localPhotoBlob(blob);
      return {
        input: {
          uri: local.uri,
          width: result.width,
          height: result.height,
          mimeType: blob.type,
        },
        blob,
        dispose: local.dispose,
      };
    } finally {
      rendered.release();
    }
  } finally {
    context.release();
    if (uri) await deleteGeneratedImage(uri);
  }
}

export function composePhotoEdit(
  confirmed: PhotoEdit,
  change: PhotoEdit,
): PhotoEdit {
  const matrix = (edit: PhotoEdit) => {
    const { rotate } = edit;
    transformedPhotoSize(1, 1, rotate);
    const c = [1, 0, -1, 0][rotate / 90]!,
      s = [0, 1, 0, -1][rotate / 90]!;
    const x = edit.flipHorizontal ? -1 : 1,
      y = edit.flipVertical ? -1 : 1;
    return [c * x, -s * y, s * x, c * y];
  };
  const a = matrix(change),
    b = matrix(confirmed);
  const combined = [
    a[0]! * b[0]! + a[1]! * b[2]!,
    a[0]! * b[1]! + a[1]! * b[3]!,
    a[2]! * b[0]! + a[3]! * b[2]!,
    a[2]! * b[1]! + a[3]! * b[3]!,
  ];
  for (const rotate of [0, 90, 180, 270])
    for (const flipHorizontal of [false, true]) {
      const candidate = {
        rotate,
        flipHorizontal,
        flipVertical: false,
        crop: change.crop,
      };
      if (matrix(candidate).every((value, i) => value === combined[i]))
        return candidate;
    }
  throw new ImagePreparationError('PROCESSING_FAILED');
}
