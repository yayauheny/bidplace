import {
  ApiClientError,
  getApiErrorCode,
  type ApiClientErrorKind,
} from '@bidplace/api-client';
import { ApiErrorCode } from '@bidplace/contracts';

const infrastructureKinds = new Set<ApiClientErrorKind>([
  'network',
  'server',
  'unexpected_response',
]);

export function getErrorStatus(error: unknown): number | null {
  return error instanceof ApiClientError ? error.status : null;
}

export function getErrorCode(error: unknown): string | null {
  return getApiErrorCode(error);
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

export function isInfrastructureError(error: unknown): boolean {
  if (!(error instanceof ApiClientError)) {
    return false;
  }

  return (
    infrastructureKinds.has(error.kind) ||
    error.code === ApiErrorCode.INTERNAL_ERROR
  );
}
