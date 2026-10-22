import { ApiClientError } from '@bidplace/api-client';

import {
  ImagePreparationError,
  type ImagePreparationErrorCode,
} from '../lib/media/prepare-image-upload';

const knownImageErrors: Record<string, string> = {
  'Unsupported image type':
    'Этот формат изображения не поддерживается. Выберите JPG, PNG или WebP.',
  'Image MIME type does not match file contents':
    'Формат файла не соответствует его содержимому. Выберите другое изображение.',
  'Image file is empty': 'Выбранный файл пустой. Выберите другое изображение.',
  'Animated images are not supported':
    'Анимированные изображения не поддерживаются.',
  'File too large':
    'Файл слишком большой. Попробуйте выбрать изображение меньшего размера.',
};

const preparationErrorMessages: Record<ImagePreparationErrorCode, string> = {
  READ_FAILED: 'Не удалось прочитать выбранное изображение.',
  EMPTY_FILE: 'Выбранный файл пустой.',
  SOURCE_TOO_LARGE: 'Исходный файл слишком большой. Выберите другое фото.',
  INVALID_DIMENSIONS: 'Не удалось определить размеры изображения.',
  PROCESSING_FAILED: 'Не удалось обработать выбранное изображение.',
  OUTPUT_TOO_LARGE: 'Не удалось уменьшить фото до допустимого размера.',
};

/** Translate only known upload failures, never arbitrary response messages. */
export function getImageUploadErrorMessage(error: unknown): string | null {
  if (error instanceof ImagePreparationError)
    return preparationErrorMessages[error.code];
  if (!(error instanceof ApiClientError)) return null;
  if (
    error.status === 503 &&
    error.message === 'Image processing is busy; retry later'
  )
    return 'Сейчас обрабатываются другие изображения. Повторите загрузку немного позже.';
  if (error.status === 413) {
    return 'Файл слишком большой. Попробуйте выбрать изображение меньшего размера.';
  }
  if (error.kind !== 'bad_request') return null;

  const message = error.message;
  if (knownImageErrors[message]) return knownImageErrors[message];

  const maxFile = /^Each image must be at most (\d+) bytes$/.exec(message);
  if (maxFile) {
    return 'Изображение превышает допустимый размер файла.';
  }

  if (
    /^Image dimensions cannot exceed \d+px on either edge$/.test(message) ||
    /^Image cannot exceed \d+ pixels$/.test(message)
  ) {
    return 'Разрешение изображения слишком большое. Выберите другое фото.';
  }

  if (
    /^image\/(jpeg|png|webp) payload is corrupted or not decodable$/.test(
      message,
    )
  ) {
    return 'Не удалось прочитать изображение. Выберите другой файл.';
  }

  if (
    /^A Product (can have at most \d+ images|cannot exceed \d+ total image bytes)$/.test(
      message,
    )
  ) {
    return 'Превышен лимит изображений или их общего размера.';
  }

  return null;
}
