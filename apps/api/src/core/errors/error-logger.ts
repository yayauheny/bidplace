import { ApiErrorCode, type ApiErrorResponse } from '@bidplace/contracts';
import { type Logger } from '@nestjs/common';

import {
  safeFailureLocation,
  safeRequestId,
  safeStatus,
} from '../request-context/safe-request-log';

const SAFE_ERROR_CODES = new Set<string>(Object.values(ApiErrorCode));

function safeErrorCode(code: string): string {
  return SAFE_ERROR_CODES.has(code) ? code : 'unknown';
}

type HttpRequestLike = {
  requestId?: string;
};

export function logUnexpectedError(
  logger: Logger,
  exception: unknown,
  request: HttpRequestLike,
  body: ApiErrorResponse,
): void {
  const location = safeFailureLocation(exception);
  const line = [
    `requestId=${safeRequestId(request.requestId)}`,
    `status=${safeStatus(body.status)}`,
    `code=${safeErrorCode(body.code)}`,
    location ? `at=${location}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' ');

  logger.error(line);
}
