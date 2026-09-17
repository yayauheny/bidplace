import {
  ApiErrorCode,
  type ApiErrorCode as ApiErrorCodeValue,
  type ApiErrorResponse,
} from '@bidplace/contracts';

import { type ApiClientErrorKind } from './api-client-error';

const businessCodeKinds: Partial<
  Record<ApiErrorCodeValue, ApiClientErrorKind>
> = {
  [ApiErrorCode.BID_TOO_LOW]: 'bad_request',
  [ApiErrorCode.IDEMPOTENCY_KEY_REQUIRED]: 'bad_request',
  [ApiErrorCode.LISTING_NOT_OPEN]: 'conflict',
  [ApiErrorCode.LISTING_CHANGED]: 'conflict',
  [ApiErrorCode.IDEMPOTENCY_CONFLICT]: 'conflict',
  [ApiErrorCode.LISTING_NOT_FOUND]: 'not_found',
  [ApiErrorCode.SELF_BID_FORBIDDEN]: 'forbidden',
  [ApiErrorCode.ADMIN_BID_FORBIDDEN]: 'forbidden',
  [ApiErrorCode.EMAIL_VERIFICATION_REQUIRED]: 'forbidden',
  [ApiErrorCode.RULES_ACCEPTANCE_REQUIRED]: 'forbidden',
  [ApiErrorCode.PASSWORD_RESET_INVALID]: 'bad_request',
};

export function classifyApiError(
  status: number,
  payload: ApiErrorResponse | null,
): ApiClientErrorKind {
  if (payload?.code) {
    const businessKind = businessCodeKinds[payload.code];
    if (businessKind) {
      return businessKind;
    }

    switch (payload.code) {
      case ApiErrorCode.VALIDATION_ERROR:
        return 'validation';
      case ApiErrorCode.BAD_REQUEST:
        return 'bad_request';
      case ApiErrorCode.UNAUTHORIZED:
        return 'unauthorized';
      case ApiErrorCode.FORBIDDEN:
        return 'forbidden';
      case ApiErrorCode.NOT_FOUND:
        return 'not_found';
      case ApiErrorCode.CONFLICT:
        return 'conflict';
      case ApiErrorCode.RATE_LIMITED:
        return 'rate_limited';
      case ApiErrorCode.INTERNAL_ERROR:
        return 'server';
      default:
        break;
    }
  }

  switch (status) {
    case 400:
      return 'bad_request';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 429:
      return 'rate_limited';
    default:
      return status >= 500 ? 'server' : 'unexpected_response';
  }
}
