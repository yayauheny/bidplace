import {
  ApiClientError,
  type ApiClientErrorKind,
} from '@bidplace/api-client';

import { ApiErrorCode } from '@bidplace/contracts';

import { isInfrastructureError } from './classify';
import { getImageUploadErrorMessage } from './image-upload-error';
import {
  AUTH_CREDENTIALS_COPY,
  AUTH_DISPOSABLE_EMAIL_COPY,
  AUTH_LOGIN_PAUSE_COPY,
  AUTH_RATE_LIMIT_COPY,
  AUTH_TURNSTILE_FAILED_COPY,
  AUTH_TURNSTILE_REQUIRED_COPY,
  AUTH_TURNSTILE_UNAVAILABLE_COPY,
  INFRASTRUCTURE_ERROR_COPY,
} from './copy';

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

  const imageMessage = getImageUploadErrorMessage(error);
  if (imageMessage) return imageMessage;

  if (error instanceof ApiClientError) {
    if (publicMessageKinds.has(error.kind) && error.message.trim()) {
      return error.message;
    }

    return genericMessagesByKind[error.kind] ?? fallbackMessage;
  }

  return fallbackMessage;
}

export function authRequestMessage(error: unknown): string | null {
  if (!(error instanceof ApiClientError)) return null;
  if (error.code === ApiErrorCode.LOGIN_PAUSED) return AUTH_LOGIN_PAUSE_COPY;
  if (error.code === ApiErrorCode.TURNSTILE_REQUIRED) return AUTH_TURNSTILE_REQUIRED_COPY;
  if (error.code === ApiErrorCode.TURNSTILE_FAILED) return AUTH_TURNSTILE_FAILED_COPY;
  if (error.code === ApiErrorCode.TURNSTILE_UNAVAILABLE) return AUTH_TURNSTILE_UNAVAILABLE_COPY;
  if (error.code === ApiErrorCode.DISPOSABLE_EMAIL) return AUTH_DISPOSABLE_EMAIL_COPY;
  if (error.kind === 'unauthorized') return AUTH_CREDENTIALS_COPY;
  if (error.kind === 'rate_limited') return AUTH_RATE_LIMIT_COPY;
  if (isInfrastructureError(error)) return INFRASTRUCTURE_ERROR_COPY;
  return null;
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
