import {
  ApiErrorCode,
  bidTooLowDetailsSchema,
} from '@bidplace/contracts';

import { ApiClientError } from './api-client-error';

export { ApiClientError, type ApiClientErrorKind } from './api-client-error';
export { classifyApiError } from './classify';
export {
  createNetworkError,
  createUnexpectedResponseError,
  parseApiError,
  throwApiClientResponseError,
} from './parse';

export function getApiErrorCode(error: unknown): string | null {
  return error instanceof ApiClientError ? error.code : null;
}

export function getBidTooLowMinimum(error: unknown): number | null {
  if (!(error instanceof ApiClientError)) {
    return null;
  }

  if (error.code !== ApiErrorCode.BID_TOO_LOW) {
    return null;
  }

  const parsed = bidTooLowDetailsSchema.safeParse(error.details);
  if (!parsed.success) {
    return null;
  }

  const value = Number(parsed.data.minimumBid);
  return Number.isFinite(value) ? value : null;
}
