import {
  apiErrorResponseSchema,
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
  readonly code: string | null;
  readonly details: unknown;

  constructor(
    message: string,
    options: {
      kind: ApiClientErrorKind;
      status: number;
      code?: string | null;
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

function mapApiErrorToKind(
  status: number,
  payload: ApiErrorResponse | null,
): ApiClientErrorKind {
  switch (payload?.code) {
    case 'validation_error':
      return 'validation';
    case 'bad_request':
      return 'bad_request';
    case 'unauthorized':
      return 'unauthorized';
    case 'forbidden':
      return 'forbidden';
    case 'not_found':
      return 'not_found';
    case 'conflict':
      return 'conflict';
    case 'rate_limited':
      return 'rate_limited';
    case 'internal_error':
      return 'server';
    default:
      break;
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
    code?: string | null;
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
    details: payload?.details ?? payload ?? null,
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
