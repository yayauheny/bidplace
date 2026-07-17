import { ApiClientError, type ApiClientErrorKind } from '@bidplace/api-client';

const genericMessagesByKind: Record<ApiClientErrorKind, string> = {
  bad_request: 'Не удалось выполнить запрос.',
  validation: 'Проверьте введённые данные и попробуйте снова.',
  unauthorized: 'Нужно войти в аккаунт заново.',
  forbidden: 'Недостаточно прав для этого действия.',
  not_found: 'Запрошенные данные не найдены.',
  conflict: 'Операцию не удалось выполнить из-за конфликта данных.',
  rate_limited: 'Слишком много запросов. Попробуйте немного позже.',
  server: 'Сервис временно недоступен. Попробуйте позже.',
  network: 'Не удалось связаться с сервером. Проверьте соединение и попробуйте снова.',
  unexpected_response: 'Сервис вернул неожиданный ответ. Попробуйте позже.',
};

const publicMessageKinds = new Set<ApiClientErrorKind>([
  'validation',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'rate_limited',
]);

export function getErrorStatus(error: unknown): number | null {
  return error instanceof ApiClientError ? error.status : null;
}

export function isNotFoundError(error: unknown): boolean {
  return getErrorStatus(error) === 404;
}

export function shouldClearSessionForError(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    (error.kind === 'unauthorized' || error.kind === 'forbidden')
  );
}

export function getUserFacingErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof ApiClientError) {
    if (publicMessageKinds.has(error.kind) && error.message.trim()) {
      return error.message;
    }

    return genericMessagesByKind[error.kind] ?? fallbackMessage;
  }

  return fallbackMessage;
}
