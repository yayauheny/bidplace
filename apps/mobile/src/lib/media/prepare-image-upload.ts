/**
 * Shared device-side preparation for images that may be resized before upload.
 * Callers choose their own limits; artwork originals should use their separate
 * lossless upload flow rather than this helper.
 */
export type ImageUploadInput = {
  uri: string;
  width?: number;
  height?: number;
  mimeType?: string | null;
  file?: File;
  /** Size reported by the picker, used for early rejection before reading the file. */
  fileSize?: number;
};

export type ImagePreparationOptions = {
  maxDimension: number;
  maxBytes: number;
  maxSourceBytes: number;
  quality: number;
  /** Override output format. By default PNG stays PNG to preserve transparency. */
  format?: 'jpeg' | 'png';
};

export type PreparedImage = {
  uri: string;
  blob: Blob;
};

export class ImagePreparationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImagePreparationError';
  }
}

export function containedDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function readImage(uri: string): Promise<Blob> {
  try {
    const response = await fetch(uri);
    if (response.ok === false) throw new Error('Image fetch failed');
    return await response.blob();
  } catch {
    throw new ImagePreparationError('Не удалось прочитать выбранное изображение.');
  }
}

/**
 * Keeps supported files unchanged when they fit the limits. Large images and
 * unsupported formats are re-encoded while preserving their aspect ratio.
 */
export async function prepareImageUpload(
  input: ImageUploadInput,
  options: ImagePreparationOptions,
): Promise<PreparedImage> {
  if (input.fileSize !== undefined && input.fileSize > options.maxSourceBytes) {
    throw new ImagePreparationError('Исходный файл слишком большой. Выберите другое фото.');
  }

  const width = input.width;
  const height = input.height;
  if (
    typeof width !== 'number' || !Number.isFinite(width) || width <= 0 ||
    typeof height !== 'number' || !Number.isFinite(height) || height <= 0
  ) {
    throw new ImagePreparationError('Не удалось определить размеры изображения.');
  }

  const source = input.file ?? (await readImage(input.uri));
  if (source.size === 0) {
    throw new ImagePreparationError('Выбранный файл пустой.');
  }
  if (source.size > options.maxSourceBytes) {
    throw new ImagePreparationError('Исходный файл слишком большой. Выберите другое фото.');
  }

  const type = (source.type || input.mimeType || '').toLowerCase();
  const supported = ['image/jpeg', 'image/png', 'image/webp'].includes(type);
  const fitsDimensions = Math.max(width, height) <= options.maxDimension;
  const requestedMimeType = options.format ? `image/${options.format}` : null;
  const matchesFormat = requestedMimeType === null || type === requestedMimeType;

  if (supported && matchesFormat && source.size <= options.maxBytes &&
      fitsDimensions) {
    return { uri: input.uri, blob: source };
  }

  const outputFormat = options.format ?? (type === 'image/png' ? 'png' : 'jpeg');

  // Only load the native/web image manipulator when a transform is necessary.
  const { ImageManipulator, SaveFormat } = await import('expo-image-manipulator');
  const initial = containedDimensions(width, height, options.maxDimension);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const scale = 0.75 ** attempt;
    const dimensions = {
      width: Math.max(1, Math.round(initial.width * scale)),
      height: Math.max(1, Math.round(initial.height * scale)),
    };
    const context = ImageManipulator.manipulate(input.uri);
    let resultUri: string;
    try {
      context.resize(dimensions);
      const rendered = await context.renderAsync();
      try {
        resultUri = (await rendered.saveAsync({
          format: outputFormat === 'png' ? SaveFormat.PNG : SaveFormat.JPEG,
          compress: options.quality,
        })).uri;
      } finally {
        rendered.release();
      }
    } catch {
      throw new ImagePreparationError('Не удалось обработать выбранное изображение.');
    } finally {
      context.release();
    }

    const encoded = await readImage(resultUri);
    if (encoded.size <= options.maxBytes && encoded.size > 0) {
      return {
        uri: resultUri,
        blob: new Blob([encoded], {
          type: outputFormat === 'png' ? 'image/png' : 'image/jpeg',
        }),
      };
    }
  }

  throw new ImagePreparationError('Не удалось уменьшить фото до допустимого размера.');
}
