import { type ApiErrorCode as ApiErrorCodeValue } from '@bidplace/contracts';

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
  readonly requestId: string | null;

  constructor(
    message: string,
    options: {
      kind: ApiClientErrorKind;
      status: number;
      code?: ApiErrorCodeValue | string | null;
      details?: unknown;
      requestId?: string | null;
      cause?: unknown;
    },
  ) {
    if (options.cause !== undefined) {
      super(message, { cause: options.cause });
    } else {
      super(message);
    }
    this.name = 'ApiClientError';
    this.kind = options.kind;
    this.status = options.status;
    this.code = options.code ?? null;
    this.details = options.details;
    this.requestId = options.requestId ?? null;
  }
}
