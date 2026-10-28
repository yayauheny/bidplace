import { HttpException } from '@nestjs/common';
import { firstValueFrom, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { RequestIdMiddleware } from './request-id.middleware';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

const USER_ID = '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1';
const HEADER_MARKER = 'header-secret-marker';
const PATH_MARKER = 'path-secret-marker';
const QUERY_MARKER = 'query-secret-marker';
const EXCEPTION_MARKER = 'exception-secret-marker';

function assignServerRequestId(request: {
  headers: Record<string, string>;
  requestId?: string;
}): string {
  const headers: Record<string, string> = {};
  const middleware = new RequestIdMiddleware();
  middleware.use(request, {
    setHeader(name, value) {
      headers[name] = value;
    },
  }, () => undefined);

  expect(headers['X-Request-Id']).toBe(request.requestId);
  expect(request.requestId).not.toBe(HEADER_MARKER);
  return headers['X-Request-Id'] ?? '';
}

describe('RequestLoggingInterceptor', () => {
  it('logs the route template and server request id for a success', async () => {
    const interceptor = new RequestLoggingInterceptor();
    const log = vi
      .spyOn(
        (interceptor as unknown as { logger: { log: () => void } }).logger,
        'log',
      )
      .mockImplementation(() => undefined);
    const request = {
      headers: { 'x-request-id': HEADER_MARKER },
      method: 'GET',
      url: `/api/works/${PATH_MARKER}?token=${QUERY_MARKER}`,
      route: { path: '/api/works/:id' },
      auth: { sub: USER_ID },
    };
    const requestId = assignServerRequestId(request);
    const response = { statusCode: 200 };

    await firstValueFrom(
      interceptor.intercept(
        {
          getType: () => 'http',
          switchToHttp: () => ({
            getRequest: () => request,
            getResponse: () => response,
          }),
        } as never,
        { handle: () => of({ ok: true }) },
      ),
    );

    expect(log).toHaveBeenCalledOnce();
    const line = String(log.mock.calls[0]?.[0]);
    expect(line).toContain(`requestId=${requestId}`);
    expect(line).toContain('method=GET');
    expect(line).toContain('route=/api/works/:id');
    expect(line).toContain('status=200');
    expect(line).toContain('durationMs=');
    expect(line).toContain(`userId=${USER_ID}`);
    expect(line).not.toContain(HEADER_MARKER);
    expect(line).not.toContain(PATH_MARKER);
    expect(line).not.toContain(QUERY_MARKER);
    expect(log.mock.calls[0]).toHaveLength(1);
    log.mockRestore();
  });

  it('logs unmatched and the status without the exception or raw url', async () => {
    const interceptor = new RequestLoggingInterceptor();
    const log = vi
      .spyOn(
        (interceptor as unknown as { logger: { log: () => void } }).logger,
        'log',
      )
      .mockImplementation(() => undefined);
    const request = {
      headers: { 'x-request-id': HEADER_MARKER },
      method: 'POST',
      url: `/api/${PATH_MARKER}?otp=${QUERY_MARKER}`,
    };
    const requestId = assignServerRequestId(request);
    const error = new HttpException(EXCEPTION_MARKER, 422);

    await expect(
      firstValueFrom(
        interceptor.intercept(
          {
            getType: () => 'http',
            switchToHttp: () => ({
              getRequest: () => request,
              getResponse: () => ({ statusCode: 200 }),
            }),
          } as never,
          { handle: () => throwError(() => error) },
        ),
      ),
    ).rejects.toBe(error);

    const line = String(log.mock.calls[0]?.[0]);
    expect(line).toContain(`requestId=${requestId}`);
    expect(line).toContain('route=unmatched');
    expect(line).toContain('status=422');
    expect(line).not.toContain(EXCEPTION_MARKER);
    expect(line).not.toContain(HEADER_MARKER);
    expect(line).not.toContain(PATH_MARKER);
    expect(line).not.toContain(QUERY_MARKER);
    log.mockRestore();
  });

  it('skips health and ready even when the url carries a query', async () => {
    const interceptor = new RequestLoggingInterceptor();
    const log = vi
      .spyOn(
        (interceptor as unknown as { logger: { log: () => void } }).logger,
        'log',
      )
      .mockImplementation(() => undefined);

    for (const url of [
      `/api/health?token=${QUERY_MARKER}`,
      `/api/health/ready?token=${QUERY_MARKER}`,
    ]) {
      await firstValueFrom(
        interceptor.intercept(
          {
            getType: () => 'http',
            switchToHttp: () => ({
              getRequest: () => ({ url, method: 'GET' }),
              getResponse: () => ({ statusCode: 200 }),
            }),
          } as never,
          { handle: () => of({ ok: true }) },
        ),
      );
    }

    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
