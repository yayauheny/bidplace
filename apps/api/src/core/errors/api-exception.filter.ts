import { type ApiErrorResponse } from '@bidplace/contracts';
import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  Logger,
} from '@nestjs/common';

import { logUnexpectedError } from './error-logger';
import {
  attachRequestId,
  mapExceptionToPublicError,
} from './error-response-mapper';

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

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<HttpResponseLike>();
    const request = context.getRequest<HttpRequestLike>();
    const mapped = mapExceptionToPublicError(exception);
    const body: ApiErrorResponse = attachRequestId(
      mapped.body,
      request.requestId,
    );

    if (mapped.shouldLog) {
      logUnexpectedError(this.logger, exception, request, body);
    }

    if (request.requestId && typeof response.setHeader === 'function') {
      response.setHeader('X-Request-Id', request.requestId);
    }

    response.status(mapped.status).json(body);
  }
}
