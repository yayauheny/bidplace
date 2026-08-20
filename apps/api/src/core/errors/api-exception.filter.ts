import {
  ApiErrorCode,
  apiErrorCodeSchema,
  apiErrorResponseSchema,
  validationErrorDetailsSchema,
  type ApiErrorCode as ApiErrorCodeValue,
  type ApiErrorResponse,
  type ValidationErrorDetails,
} from '@bidplace/contracts';
import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { AppException } from './app.exception';

type HttpRequestLike = {
  method?: string;
  url?: string;
  requestId?: string;
};

type HttpResponseLike = {
  status(code: number): HttpResponseLike;
  setHeader?(name: string, value: string): void;
  json(payload: unknown): void;
};

type HttpExceptionResponse =
  | string
  | {
      code?: unknown;
      message?: unknown;
      details?: unknown;
    };

const defaultErrorMessages: Record<ApiErrorCodeValue, string> = {
  [ApiErrorCode.BAD_REQUEST]: 'Bad request',
  [ApiErrorCode.VALIDATION_ERROR]: 'Request validation failed',
  [ApiErrorCode.UNAUTHORIZED]: 'Unauthorized',
  [ApiErrorCode.FORBIDDEN]: 'Forbidden',
  [ApiErrorCode.NOT_FOUND]: 'Not found',
  [ApiErrorCode.CONFLICT]: 'Conflict',
  [ApiErrorCode.RATE_LIMITED]: 'Too many requests',
  [ApiErrorCode.INTERNAL_ERROR]: 'Internal server error',
  [ApiErrorCode.BID_TOO_LOW]: 'Bid is below the minimum',
  [ApiErrorCode.LISTING_NOT_OPEN]: 'Listing is not open for bids',
  [ApiErrorCode.LISTING_NOT_FOUND]: 'Listing not found',
  [ApiErrorCode.LISTING_CHANGED]: 'Listing changed while placing bid',
  [ApiErrorCode.SELF_BID_FORBIDDEN]: 'Cannot bid on your own Listing',
  [ApiErrorCode.ADMIN_BID_FORBIDDEN]: 'Administrators cannot place bids',
  [ApiErrorCode.EMAIL_VERIFICATION_REQUIRED]: 'Email verification is required',
  [ApiErrorCode.RULES_ACCEPTANCE_REQUIRED]:
    'Service rules acceptance is required',
  [ApiErrorCode.IDEMPOTENCY_KEY_REQUIRED]: 'Idempotency-Key is required',
  [ApiErrorCode.IDEMPOTENCY_CONFLICT]:
    'Idempotency key does not match request',
};

function mapStatusToCode(status: number): ApiErrorCodeValue {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ApiErrorCode.BAD_REQUEST;
    case HttpStatus.UNAUTHORIZED:
      return ApiErrorCode.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ApiErrorCode.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ApiErrorCode.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return ApiErrorCode.CONFLICT;
    case HttpStatus.TOO_MANY_REQUESTS:
      return ApiErrorCode.RATE_LIMITED;
    default:
      return status >= 500
        ? ApiErrorCode.INTERNAL_ERROR
        : ApiErrorCode.BAD_REQUEST;
  }
}

function extractHttpExceptionMessage(
  response: HttpExceptionResponse,
): string | null {
  if (typeof response === 'string') {
    return response;
  }

  if (typeof response?.message === 'string' && response.message.trim()) {
    return response.message;
  }

  if (Array.isArray(response?.message)) {
    const joinedMessage = response.message
      .filter(
        (value): value is string =>
          typeof value === 'string' && value.trim().length > 0,
      )
      .join(', ');

    return joinedMessage || null;
  }

  return null;
}

function extractExplicitCode(
  response: HttpExceptionResponse,
): ApiErrorCodeValue | null {
  if (typeof response === 'string') {
    return null;
  }

  const parsed = apiErrorCodeSchema.safeParse(response?.code);
  return parsed.success ? parsed.data : null;
}

function extractValidationDetails(
  response: HttpExceptionResponse,
): ValidationErrorDetails | undefined {
  if (typeof response === 'string') {
    return undefined;
  }

  const explicitDetails = validationErrorDetailsSchema.safeParse(
    response?.details,
  );

  if (explicitDetails.success) {
    return explicitDetails.data;
  }

  const implicitDetails = validationErrorDetailsSchema.safeParse(response);

  if (implicitDetails.success) {
    return implicitDetails.data;
  }

  return undefined;
}

function extractDetails(
  response: HttpExceptionResponse,
  code: ApiErrorCodeValue,
): unknown {
  if (typeof response === 'string') {
    return undefined;
  }

  if (code === ApiErrorCode.VALIDATION_ERROR) {
    return extractValidationDetails(response);
  }

  if (response?.details !== undefined) {
    return response.details;
  }

  return undefined;
}

function createApiErrorResponse(input: ApiErrorResponse): ApiErrorResponse {
  return apiErrorResponseSchema.parse(input);
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<HttpResponseLike>();
    const request = context.getRequest<HttpRequestLike>();
    const { status, body, shouldLog } = this.normalizeException(exception);

    if (shouldLog) {
      this.logUnexpectedError(exception, request, body);
    }

    if (request.requestId && typeof response.setHeader === 'function') {
      response.setHeader('X-Request-Id', request.requestId);
    }

    response.status(status).json(body);
  }

  private normalizeException(exception: unknown): {
    status: number;
    body: ApiErrorResponse;
    shouldLog: boolean;
  } {
    if (!(exception instanceof HttpException)) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        body: createApiErrorResponse({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: ApiErrorCode.INTERNAL_ERROR,
          message: defaultErrorMessages[ApiErrorCode.INTERNAL_ERROR],
        }),
        shouldLog: true,
      };
    }

    const status = exception.getStatus();
    const response = exception.getResponse() as HttpExceptionResponse;
    const validationDetails = extractValidationDetails(response);
    const explicitCode =
      exception instanceof AppException
        ? exception.apiCode
        : extractExplicitCode(response);
    const code =
      explicitCode ??
      (validationDetails && status === HttpStatus.BAD_REQUEST
        ? ApiErrorCode.VALIDATION_ERROR
        : mapStatusToCode(status));
    const message =
      status >= 500
        ? defaultErrorMessages[ApiErrorCode.INTERNAL_ERROR]
        : extractHttpExceptionMessage(response) ??
          defaultErrorMessages[code] ??
          defaultErrorMessages[ApiErrorCode.BAD_REQUEST];
    const details = extractDetails(response, code);

    return {
      status,
      body: createApiErrorResponse({
        status,
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      }),
      shouldLog: status >= 500,
    };
  }

  private logUnexpectedError(
    exception: unknown,
    request: HttpRequestLike,
    body: ApiErrorResponse,
  ): void {
    const requestLabel = [request.method, request.url]
      .filter(Boolean)
      .join(' ');
    const requestIdLabel = request.requestId
      ? ` requestId=${request.requestId}`
      : '';
    const context = requestLabel
      ? `[${requestLabel}]${requestIdLabel}`
      : `[unknown request]${requestIdLabel}`;

    if (exception instanceof Error) {
      this.logger.error(
        `${context} ${body.code}: ${exception.message}`,
        exception.stack,
      );
      return;
    }

    this.logger.error(`${context} ${body.code}: ${String(exception)}`);
  }
}
