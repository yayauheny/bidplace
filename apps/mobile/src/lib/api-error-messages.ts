import { getApiErrorCode } from '@bidplace/api-client';

export function apiErrorMessage(error: unknown): string | null {
  switch (getApiErrorCode(error)) {
    case 'PRODUCT_IN_SALE':
      return 'Работа сейчас в продаже. Снимите лот, чтобы изменить или скрыть её';
    case 'PRODUCT_STATE_CONFLICT':
      return 'Работа изменилась. Обновите страницу и попробуйте снова';
    default:
      return null;
  }
}
