import { ApiErrorCode } from '@bidplace/contracts';
import { describe, expect, it } from 'vitest';

import {
  ApiClientError,
  getApiErrorCode,
  getBidTooLowMinimum,
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
});
