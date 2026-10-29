import {
  ApiErrorCode,
  apiErrorCodeSchema,
  apiErrorResponseSchema,
  validationErrorDetailsSchema,
  type ApiErrorCode as ApiErrorCodeValue,
  type ApiErrorResponse,
  type ValidationErrorDetails,
} from '@bidplace/contracts';
import { HttpException, HttpStatus } from '@nestjs/common';

import { AppException } from './app.exception';

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
  [ApiErrorCode.PRODUCT_STATE_CONFLICT]: 'Product state changed',
  [ApiErrorCode.PRODUCT_IN_SALE]: 'Product is locked by an active sale',
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
  [ApiErrorCode.PASSWORD_RESET_INVALID]:
    'Password reset link is invalid or expired',
  [ApiErrorCode.TURNSTILE_REQUIRED]: 'Turnstile token is required',
  [ApiErrorCode.TURNSTILE_FAILED]: 'Turnstile verification failed',
  [ApiErrorCode.TURNSTILE_UNAVAILABLE]: 'Turnstile verification is unavailable',
  [ApiErrorCode.DISPOSABLE_EMAIL]: 'Disposable email domains cannot be registered',
  [ApiErrorCode.MAIL_COOLDOWN]: 'Email resend cooldown is active',
  [ApiErrorCode.MAIL_QUOTA]: 'Email quota is exhausted',
  [ApiErrorCode.MAIL_BUDGET]: 'Email budget is exhausted',
  [ApiErrorCode.MAIL_REJECTED]: 'Email was rejected by the mail server',
  [ApiErrorCode.EMAIL_LOGIN_REJECTED]: 'Email login could not be verified',
  [ApiErrorCode.OTP_INVALID]: 'OTP is invalid',
  [ApiErrorCode.OTP_EXPIRED]: 'OTP has expired',
  [ApiErrorCode.OTP_PAUSED]: 'OTP retry pause is active',
  [ApiErrorCode.LOGIN_PAUSED]: 'Login pause is active',
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

export function attachRequestId(
  body: ApiErrorResponse,
  requestId: string | undefined,
): ApiErrorResponse {
  if (!requestId) {
    return body;
  }

  return createApiErrorResponse({
    ...body,
    requestId,
  });
}

export function mapExceptionToPublicError(exception: unknown): {
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
