import { ApiClientError } from '@bidplace/api-client';
import { describe, expect, it } from 'vitest';

import { apiErrorMessage } from './api-error-messages';

describe('apiErrorMessage', () => {
  it.each([
    ['PRODUCT_IN_SALE', 'Работа сейчас в продаже. Снимите лот, чтобы изменить или скрыть её'],
    ['PRODUCT_STATE_CONFLICT', 'Работа изменилась. Обновите страницу и попробуйте снова'],
    ['conflict', null],
  ] as const)('maps %s to its approved work message or leaves the fallback', (code, message) => {
    expect(apiErrorMessage(new ApiClientError('Internal detail', {
      kind: 'conflict', status: 409, code,
    }))).toBe(message);
  });

  it.each([new Error('network'), null, { code: 'PRODUCT_IN_SALE' }])(
    'leaves non-API errors to the consumer fallback', (error) => {
      expect(apiErrorMessage(error)).toBeNull();
    },
  );
});
