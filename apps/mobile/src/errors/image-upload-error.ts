import { ApiClientError } from '@bidplace/api-client';

const knownImageErrors: Record<string, string> = {
  'Unsupported image type': 'Этот формат изображения не поддерживается. Выберите JPG, PNG или WebP.',
  'Image MIME type does not match file contents': 'Формат файла не соответствует его содержимому. Выберите другое изображение.',
  'Image file is empty': 'Выбранный файл пустой. Выберите другое изображение.',
  'Animated images are not supported': 'Анимированные изображения не поддерживаются.',
  'File too large': 'Файл слишком большой. Попробуйте выбрать изображение меньшего размера.',
};

/**
 * Only translate known image-upload failures. Never display arbitrary 400
 * response bodies as user-facing text.
 */
export function getImageUploadErrorMessage(error: ApiClientError): string | null {
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

  if (/^Image dimensions cannot exceed \d+px on either edge$/.test(message) ||
      /^Image cannot exceed \d+ pixels$/.test(message)) {
    return 'Разрешение изображения слишком большое. Выберите другое фото.';
  }

  if (/^image\/(jpeg|png|webp) payload is corrupted or not decodable$/.test(message)) {
    return 'Не удалось прочитать изображение. Выберите другой файл.';
  }

  if (/^A Product (can have at most \d+ images|cannot exceed \d+ total image bytes)$/.test(message)) {
    return 'Превышен лимит изображений или их общего размера.';
  }

  return null;
}
