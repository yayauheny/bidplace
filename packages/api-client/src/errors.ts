import {
  ApiErrorCode,
  apiErrorResponseSchema,
  bidTooLowDetailsSchema,
  type ApiErrorCode as ApiErrorCodeValue,
  type ApiErrorResponse,
} from '@bidplace/contracts';

export type ApiClientErrorKind =
  | 'bad_request'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'server'
  | 'network'
  | 'unexpected_response';

export class ApiClientError extends Error {
  readonly kind: ApiClientErrorKind;
  readonly status: number;
  readonly code: ApiErrorCodeValue | string | null;
  readonly details: unknown;

  constructor(
    message: string,
    options: {
      kind: ApiClientErrorKind;
      status: number;
      code?: ApiErrorCodeValue | string | null;
      details?: unknown;
    },
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.kind = options.kind;
    this.status = options.status;
    this.code = options.code ?? null;
    this.details = options.details;
  }
}

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
};

function mapApiErrorToKind(
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

function createApiClientError(
  message: string,
  options: {
    kind: ApiClientErrorKind;
    status: number;
    code?: ApiErrorCodeValue | string | null;
    details?: unknown;
  },
): ApiClientError {
  return new ApiClientError(message, options);
}

async function readErrorPayload(
  response: Response,
): Promise<ApiErrorResponse | null> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    const payload = (await response.json()) as unknown;
    const result = apiErrorResponseSchema.safeParse(payload);

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function throwApiClientResponseError(
  response: Response,
): Promise<never> {
  const payload = await readErrorPayload(response);
  const kind = mapApiErrorToKind(response.status, payload);
  const message = payload?.message || response.statusText || 'Request failed';

  throw createApiClientError(message, {
    kind,
    status: response.status,
    code: payload?.code ?? null,
    details: payload?.details ?? null,
  });
}

export function createNetworkError(): ApiClientError {
  return createApiClientError('Network request failed', {
    kind: 'network',
    status: 0,
  });
}

export function createUnexpectedResponseError(status: number): ApiClientError {
  return createApiClientError('Unexpected response from server', {
    kind: 'unexpected_response',
    status,
  });
}

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
