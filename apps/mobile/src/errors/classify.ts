import {
  ApiClientError,
  getApiErrorCode,
  type ApiClientErrorKind,
} from '@bidplace/api-client';

const infrastructureKinds = new Set<ApiClientErrorKind>([
  'network',
  'server',
  'unexpected_response',
]);

export function getErrorStatus(error: unknown): number | null {
  return error instanceof ApiClientError ? error.status : null;
}

export function getErrorCode(error: unknown) {
  return getApiErrorCode(error);
}

export function isNotFoundError(error: unknown): boolean {
  return getErrorStatus(error) === 404;
}

export function shouldClearSessionForError(error: unknown): boolean {
  return error instanceof ApiClientError && error.kind === 'unauthorized';
}

export function isInfrastructureError(error: unknown): boolean {
  return error instanceof ApiClientError && infrastructureKinds.has(error.kind);
}
