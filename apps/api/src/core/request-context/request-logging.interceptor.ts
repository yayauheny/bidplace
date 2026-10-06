import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable, tap } from 'rxjs';

import {
  safeDurationMs,
  safeMethod,
  safeRequestId,
  safeRouteTemplate,
  safeStatus,
  safeUserId,
} from './safe-request-log';

type LoggedRequest = {
  method?: string;
  url?: string;
  route?: { path?: unknown };
  requestId?: string;
  auth?: { sub?: string };
};

type LoggedResponse = {
  statusCode?: number;
};

const HEALTH_PATHS = new Set([
  '/health',
  '/health/ready',
  '/api/health',
  '/api/health/ready',
]);

function isHealthRequest(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  const queryIndex = url.search(/[?#]/);
  const pathname = queryIndex === -1 ? url : url.slice(0, queryIndex);
  return HEALTH_PATHS.has(pathname);
}

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<LoggedRequest>();
    const response = http.getResponse<LoggedResponse>();

    if (isHealthRequest(request.url)) {
      return next.handle();
    }

    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.writeLog(request, response.statusCode ?? 200, startedAt);
        },
        error: (error: unknown) => {
          const status =
            error instanceof Error &&
            'getStatus' in error &&
            typeof error.getStatus === 'function'
              ? Number(error.getStatus())
              : 500;
          this.writeLog(request, status, startedAt);
        },
      }),
    );
  }

  private writeLog(
    request: LoggedRequest,
    status: number,
    startedAt: number,
  ): void {
    const userId = safeUserId(request.auth?.sub);
    this.logger.log(
      [
        `requestId=${safeRequestId(request.requestId)}`,
        `method=${safeMethod(request.method)}`,
        `route=${safeRouteTemplate(request.route?.path)}`,
        `status=${safeStatus(status)}`,
        `durationMs=${safeDurationMs(startedAt)}`,
        userId ? `userId=${userId}` : null,
      ]
        .filter((part): part is string => part !== null)
        .join(' '),
    );
  }
}
