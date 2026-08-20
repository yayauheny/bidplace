import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable, tap } from 'rxjs';

type LoggedRequest = {
  method?: string;
  url?: string;
  route?: { path?: string };
  requestId?: string;
  auth?: { sub?: string };
};

type LoggedResponse = {
  statusCode?: number;
};

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
    const url = request.url ?? '';

    if (url === '/api/health' || url === '/health' || url.endsWith('/health')) {
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
    const userId = request.auth?.sub;
    this.logger.log(
      [
        `requestId=${request.requestId ?? 'unknown'}`,
        `method=${request.method ?? 'UNKNOWN'}`,
        `route=${request.route?.path ?? request.url ?? 'unknown'}`,
        `status=${status}`,
        `durationMs=${Date.now() - startedAt}`,
        userId ? `userId=${userId}` : null,
      ]
        .filter(Boolean)
        .join(' '),
    );
  }
}
