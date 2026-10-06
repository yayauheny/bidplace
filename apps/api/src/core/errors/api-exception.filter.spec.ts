import { ApiErrorCode } from '@bidplace/contracts';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { AppException } from './app.exception';
import { ApiExceptionFilter } from './api-exception.filter';

function createHost(response: {
  statusCode?: number;
  body?: unknown;
  headers?: Record<string, string>;
}, request: { method?: string; url?: string; requestId?: string } = {
  method: 'POST',
  url: '/api/listings/x/bids',
}) {
  const httpResponse = {
    status(code: number) {
      response.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      response.headers ??= {};
      response.headers[name] = value;
    },
    json(payload: unknown) {
      response.body = payload;
    },
  };

  return {
    switchToHttp: () => ({
      getResponse: () => httpResponse,
      getRequest: () => request,
    }),
  };
}

describe('ApiExceptionFilter', () => {
  it('preserves AppException business code and details', () => {
    const filter = new ApiExceptionFilter();
    const captured: { statusCode?: number; body?: unknown } = {};

    filter.catch(
      new AppException({
        status: HttpStatus.BAD_REQUEST,
        code: ApiErrorCode.BID_TOO_LOW,
        message: 'Bid must be at least 11.50',
        details: { minimumBid: '11.50' },
      }),
      createHost(captured) as never,
    );

    expect(captured.statusCode).toBe(400);
    expect(captured.body).toEqual({
      status: 400,
      code: ApiErrorCode.BID_TOO_LOW,
      message: 'Bid must be at least 11.50',
      details: { minimumBid: '11.50' },
    });
  });

  it('maps plain Nest exceptions to category codes', () => {
    const filter = new ApiExceptionFilter();
    const captured: { statusCode?: number; body?: unknown } = {};

    filter.catch(
      new BadRequestException('Something invalid'),
      createHost(captured) as never,
    );

    expect(captured).toMatchObject({
      statusCode: 400,
      body: {
        status: 400,
        code: ApiErrorCode.BAD_REQUEST,
        message: 'Something invalid',
      },
    });
  });

  it('masks unexpected errors as INTERNAL_ERROR without leaking details', () => {
    const filter = new ApiExceptionFilter();
    const captured: {
      statusCode?: number;
      body?: unknown;
      headers?: Record<string, string>;
    } = {};
    const loggerError = vi
      .spyOn((filter as unknown as { logger: { error: () => void } }).logger, 'error')
      .mockImplementation(() => undefined);
    const requestId = '6c456e1f-37b0-4733-a939-b5fa1a1e565d';

    filter.catch(
      new Error('relation "bids" does not exist'),
      createHost(captured, {
        method: 'POST',
        url: '/api/listings/x/bids',
        requestId,
      }) as never,
    );

    expect(captured.statusCode).toBe(500);
    expect(captured.body).toEqual({
      status: 500,
      code: ApiErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
      requestId,
    });
    expect(captured.headers?.['X-Request-Id']).toBe(requestId);
    expect(JSON.stringify(captured.body)).not.toContain('relation');
    expect(loggerError).toHaveBeenCalledOnce();
    const line = String(loggerError.mock.calls[0]?.[0]);
    expect(loggerError.mock.calls[0]).toHaveLength(1);
    expect(line).toContain(`requestId=${requestId}`);
    expect(line).toContain('status=500');
    expect(line).toContain(`code=${ApiErrorCode.INTERNAL_ERROR}`);
    expect(line).not.toContain('relation');
    expect(line).not.toContain('/api/listings');
    expect(line).not.toContain('/Users/');
    loggerError.mockRestore();
  });

  it('keeps a safe 5xx location and drops request secrets', () => {
    const filter = new ApiExceptionFilter();
    const captured: {
      statusCode?: number;
      body?: unknown;
      headers?: Record<string, string>;
    } = {};
    const loggerError = vi
      .spyOn((filter as unknown as { logger: { error: () => void } }).logger, 'error')
      .mockImplementation(() => undefined);
    const pathMarker = 'path-secret-marker';
    const queryMarker = 'query-secret-marker';
    const exceptionMarker = 'exception-secret-marker';
    const requestIdMarker = 'header-secret-marker';
    const error = new Error(exceptionMarker);
    error.stack = [
      `Error: ${exceptionMarker}`,
      `    at leak (/tmp/${pathMarker}.ts:1:1)`,
      '    at WorkService.create (/Users/dev/bidplace/apps/api/src/products/products.service.ts:42:5)',
    ].join('\n');

    filter.catch(
      error,
      createHost(captured, {
        method: 'POST',
        url: `/api/${pathMarker}?token=${queryMarker}`,
        requestId: requestIdMarker,
      }) as never,
    );

    const line = String(loggerError.mock.calls[0]?.[0]);
    expect(line).toContain('requestId=unknown');
    expect(line).toContain('status=500');
    expect(line).toContain(`code=${ApiErrorCode.INTERNAL_ERROR}`);
    expect(line).toContain('at=apps/api/src/products/products.service.ts:42');
    expect(line).not.toContain(pathMarker);
    expect(line).not.toContain(queryMarker);
    expect(line).not.toContain(exceptionMarker);
    expect(line).not.toContain(requestIdMarker);
    expect(line).not.toContain('/Users/');
    expect(JSON.stringify(captured.body)).not.toContain(exceptionMarker);
    expect(captured.headers?.['X-Request-Id']).toBe(requestIdMarker);

    captured.body = undefined;
    filter.catch(
      exceptionMarker,
      createHost(captured, {
        url: `/api/${pathMarker}`,
        requestId: requestIdMarker,
      }) as never,
    );
    const stringLine = String(loggerError.mock.calls[1]?.[0]);
    expect(stringLine).toContain('status=500');
    expect(stringLine).toContain(`code=${ApiErrorCode.INTERNAL_ERROR}`);
    expect(stringLine).not.toContain(exceptionMarker);
    expect(stringLine).not.toContain(pathMarker);
    loggerError.mockRestore();
  });

  it('keeps validation_error with field details', () => {
    const filter = new ApiExceptionFilter();
    const captured: { statusCode?: number; body?: unknown } = {};

    filter.catch(
      new AppException({
        status: HttpStatus.BAD_REQUEST,
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Request validation failed',
        details: {
          formErrors: [],
          fieldErrors: { amount: ['Required'] },
        },
      }),
      createHost(captured) as never,
    );

    expect(captured.body).toMatchObject({
      status: 400,
      code: ApiErrorCode.VALIDATION_ERROR,
      details: {
        fieldErrors: { amount: ['Required'] },
      },
    });
  });
});
