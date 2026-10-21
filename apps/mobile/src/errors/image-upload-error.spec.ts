import { ApiClientError } from '@bidplace/api-client';
import { describe, expect, it } from 'vitest';

import { getUserFacingErrorMessage } from './policy';

const apiError = (message: string, status = 400) =>
  new ApiClientError(message, {
    kind: 'bad_request',
    status,
  });

describe('image upload error messages', () => {
  it.each([
    ['Unsupported image type', 'Этот формат изображения не поддерживается. Выберите JPG, PNG или WebP.'],
    ['Image MIME type does not match file contents', 'Формат файла не соответствует его содержимому. Выберите другое изображение.'],
    ['File too large', 'Файл слишком большой. Попробуйте выбрать изображение меньшего размера.'],
    ['Image dimensions cannot exceed 4096px on either edge', 'Разрешение изображения слишком большое. Выберите другое фото.'],
    ['Image cannot exceed 16777216 pixels', 'Разрешение изображения слишком большое. Выберите другое фото.'],
    ['image/png payload is corrupted or not decodable', 'Не удалось прочитать изображение. Выберите другой файл.'],
  ])('makes %s actionable', (message, expected) => {
    expect(getUserFacingErrorMessage(apiError(message), 'fallback')).toBe(expected);
  });

  it('maps payload-too-large responses even without JSON', () => {
    expect(getUserFacingErrorMessage(apiError('Payload Too Large', 413), 'fallback')).toMatch(/слишком большой/);
  });

  it('never displays arbitrary bad-request messages', () => {
    expect(getUserFacingErrorMessage(apiError('Internal implementation detail'), 'fallback')).toBe('Не удалось выполнить запрос.');
  });

  it('does not treat an image-like server failure as validation feedback', () => {
    const error = new ApiClientError('Unsupported image type', { kind: 'server', status: 500 });
    expect(getUserFacingErrorMessage(error, 'fallback')).toBe('Проверьте соединение и попробуйте ещё раз.');
  });
});
