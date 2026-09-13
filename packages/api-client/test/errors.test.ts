import { ApiErrorCode } from '@bidplace/contracts';
import { describe, expect, it } from 'vitest';

import {
  ApiClientError,
  getApiErrorCode,
  throwApiClientResponseError,
} from '../src/errors';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('api-client errors', () => {
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

  it('exposes the helper for API error codes', () => {
    const error = new ApiClientError('Request validation failed', {
      kind: 'validation',
      status: 400,
      code: ApiErrorCode.VALIDATION_ERROR,
    });

    expect(getApiErrorCode(error)).toBe(ApiErrorCode.VALIDATION_ERROR);
    expect(getApiErrorCode(new Error('nope'))).toBeNull();
  });
});
