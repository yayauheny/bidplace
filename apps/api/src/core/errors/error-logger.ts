import { type ApiErrorResponse } from '@bidplace/contracts';
import { type Logger } from '@nestjs/common';

type HttpRequestLike = {
  method?: string;
  url?: string;
  requestId?: string;
};

export function logUnexpectedError(
  logger: Logger,
  exception: unknown,
  request: HttpRequestLike,
  body: ApiErrorResponse,
): void {
  const requestLabel = [request.method, request.url].filter(Boolean).join(' ');
  const requestIdLabel = request.requestId
    ? ` requestId=${request.requestId}`
    : '';
  const context = requestLabel
    ? `[${requestLabel}]${requestIdLabel}`
    : `[unknown request]${requestIdLabel}`;

  if (exception instanceof Error) {
    logger.error(
      `${context} ${body.code}: ${exception.message}`,
      exception.stack,
    );
    return;
  }

  logger.error(`${context} ${body.code}: ${String(exception)}`);
}
