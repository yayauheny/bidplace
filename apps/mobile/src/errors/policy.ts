import {
  ApiClientError,
  type ApiClientErrorKind,
} from '@bidplace/api-client';

import { isInfrastructureError } from './classify';
import { INFRASTRUCTURE_ERROR_COPY } from './copy';

const genericMessagesByKind: Record<ApiClientErrorKind, string> = {
  bad_request: 'Не удалось выполнить запрос.',
  validation: 'Проверьте введённые данные и попробуйте снова.',
  unauthorized: 'Нужно войти в аккаунт заново.',
  forbidden: 'Недостаточно прав для этого действия.',
  not_found: 'Запрошенные данные не найдены.',
  conflict: 'Операцию не удалось выполнить из-за конфликта данных.',
  rate_limited: 'Слишком много запросов. Попробуйте немного позже.',
  server: INFRASTRUCTURE_ERROR_COPY,
  network: INFRASTRUCTURE_ERROR_COPY,
  unexpected_response: INFRASTRUCTURE_ERROR_COPY,
};

const publicMessageKinds = new Set<ApiClientErrorKind>([
  'validation',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'rate_limited',
]);

export function getUserFacingErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (isInfrastructureError(error)) {
    return INFRASTRUCTURE_ERROR_COPY;
  }

  if (error instanceof ApiClientError) {
    if (publicMessageKinds.has(error.kind) && error.message.trim()) {
      return error.message;
    }

    return genericMessagesByKind[error.kind] ?? fallbackMessage;
  }

  return fallbackMessage;
}

export function logInfrastructureError(
  error: unknown,
  surface: string,
): void {
  if (!isInfrastructureError(error)) {
    return;
  }

  if (!(error instanceof ApiClientError)) {
    return;
  }

  console.info('[infrastructure-error]', {
    surface,
    kind: error.kind,
    status: error.status,
    code: error.code,
    requestId: error.requestId,
    message: error.message,
    cause: error.cause,
  });
}
