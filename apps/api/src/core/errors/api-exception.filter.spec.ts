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

    filter.catch(
      new Error('relation "bids" does not exist'),
      createHost(captured, {
        method: 'POST',
        url: '/api/listings/x/bids',
        requestId: 'req-123',
      }) as never,
    );

    expect(captured.statusCode).toBe(500);
    expect(captured.body).toEqual({
      status: 500,
      code: ApiErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
    });
    expect(captured.headers?.['X-Request-Id']).toBe('req-123');
    expect(JSON.stringify(captured.body)).not.toContain('relation');
    expect(loggerError).toHaveBeenCalledWith(
      expect.stringContaining('requestId=req-123'),
      expect.any(String),
    );
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
