import {
  apiErrorResponseSchema,
  validationErrorDetailsSchema,
  type ApiErrorCode,
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

type HttpRequestLike = {
  method?: string;
  url?: string;
};

type HttpResponseLike = {
  status(code: number): HttpResponseLike;
  json(payload: unknown): void;
};

type HttpExceptionResponse =
  | string
  | {
      code?: unknown;
      message?: unknown;
      details?: unknown;
    };

const defaultErrorMessages: Record<ApiErrorCode, string> = {
  bad_request: 'Bad request',
  validation_error: 'Request validation failed',
  unauthorized: 'Unauthorized',
  forbidden: 'Forbidden',
  not_found: 'Not found',
  conflict: 'Conflict',
  rate_limited: 'Too many requests',
  internal_error: 'Internal server error',
};

function mapStatusToCode(status: number): ApiErrorCode {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'bad_request';
    case HttpStatus.UNAUTHORIZED:
      return 'unauthorized';
    case HttpStatus.FORBIDDEN:
      return 'forbidden';
    case HttpStatus.NOT_FOUND:
      return 'not_found';
    case HttpStatus.CONFLICT:
      return 'conflict';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'rate_limited';
    default:
      return status >= 500 ? 'internal_error' : 'bad_request';
  }
}

function extractHttpExceptionMessage(response: HttpExceptionResponse): string | null {
  if (typeof response === 'string') {
    return response;
  }

  if (typeof response?.message === 'string' && response.message.trim()) {
    return response.message;
  }

  if (Array.isArray(response?.message)) {
    const joinedMessage = response.message
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .join(', ');

    return joinedMessage || null;
  }

  return null;
}

function extractValidationDetails(
  response: HttpExceptionResponse,
): ValidationErrorDetails | undefined {
  if (typeof response === 'string') {
    return undefined;
  }

  const explicitDetails = validationErrorDetailsSchema.safeParse(response?.details);

  if (explicitDetails.success) {
    return explicitDetails.data;
  }

  const implicitDetails = validationErrorDetailsSchema.safeParse(response);

  if (implicitDetails.success) {
    return implicitDetails.data;
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
          code: 'internal_error',
          message: defaultErrorMessages.internal_error,
        }),
        shouldLog: true,
      };
    }

    const status = exception.getStatus();
    const response = exception.getResponse() as HttpExceptionResponse;
    const validationDetails = extractValidationDetails(response);
    const code =
      validationDetails && status === HttpStatus.BAD_REQUEST
        ? 'validation_error'
        : mapStatusToCode(status);
    const message =
      status >= 500
        ? defaultErrorMessages.internal_error
        : extractHttpExceptionMessage(response) ?? defaultErrorMessages[code];

    return {
      status,
      body: createApiErrorResponse({
        status,
        code,
        message,
        details: validationDetails,
      }),
      shouldLog: status >= 500,
    };
  }

  private logUnexpectedError(
    exception: unknown,
    request: HttpRequestLike,
    body: ApiErrorResponse,
  ): void {
    const requestLabel = [request.method, request.url].filter(Boolean).join(' ');
    const context = requestLabel ? `[${requestLabel}]` : '[unknown request]';

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
