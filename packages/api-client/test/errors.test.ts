import { ApiErrorCode } from '@bidplace/contracts';
import { describe, expect, it } from 'vitest';

import {
  ApiClientError,
  createNetworkError,
  getApiErrorCode,
  getBidTooLowMinimum,
  parseApiError,
  throwApiClientResponseError,
} from '../src/errors';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('api-client errors', () => {
  it('parses BID_TOO_LOW with minimumBid details', async () => {
    await expect(
      throwApiClientResponseError(
        jsonResponse(400, {
          status: 400,
          code: ApiErrorCode.BID_TOO_LOW,
          message: 'Bid must be at least 11.50',
          details: { minimumBid: '11.50' },
        }),
      ),
    ).rejects.toMatchObject({
      name: 'ApiClientError',
      kind: 'bad_request',
      status: 400,
      code: ApiErrorCode.BID_TOO_LOW,
      details: { minimumBid: '11.50' },
    });
  });

  it('parses PASSWORD_RESET_INVALID as bad_request', async () => {
    await expect(
      throwApiClientResponseError(
        jsonResponse(400, {
          status: 400,
          code: ApiErrorCode.PASSWORD_RESET_INVALID,
          message: 'Password reset link is invalid or expired',
        }),
      ),
    ).rejects.toMatchObject({
      name: 'ApiClientError',
      kind: 'bad_request',
      status: 400,
      code: ApiErrorCode.PASSWORD_RESET_INVALID,
    });
  });

  it('exposes helpers for code and bid minimum', () => {
    const error = new ApiClientError('Bid must be at least 11.50', {
      kind: 'bad_request',
      status: 400,
      code: ApiErrorCode.BID_TOO_LOW,
      details: { minimumBid: '11.50' },
    });

    expect(getApiErrorCode(error)).toBe(ApiErrorCode.BID_TOO_LOW);
    expect(getBidTooLowMinimum(error)).toBe(11.5);
    expect(getBidTooLowMinimum(new Error('nope'))).toBeNull();
  });

  it('keeps requestId and diagnostic message off the UI contract', async () => {
    const error = await throwApiClientResponseError(
      new Response(
        JSON.stringify({
          status: 500,
          code: ApiErrorCode.INTERNAL_ERROR,
          message: 'Internal server error',
          requestId: 'req-456',
        }),
        {
          status: 500,
          statusText: 'Internal Server Error',
          headers: {
            'content-type': 'application/json',
            'x-request-id': 'req-header',
          },
        },
      ),
    ).catch((value: unknown) => value);

    expect(error).toMatchObject({
      name: 'ApiClientError',
      kind: 'server',
      status: 500,
      code: ApiErrorCode.INTERNAL_ERROR,
      requestId: 'req-456',
      message: 'Internal server error',
    });
    expect(
      parseApiError({
        status: 500,
        code: ApiErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
        requestId: 'req-456',
      }),
    ).toMatchObject({ requestId: 'req-456' });
  });

  it('preserves the original network cause', () => {
    const cause = new TypeError('Failed to fetch');
    const error = createNetworkError(cause);

    expect(error.kind).toBe('network');
    expect(error.status).toBe(0);
    expect(error.cause).toBe(cause);
    expect(error.message).toBe('Network request failed');
  });
});
