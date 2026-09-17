import { ApiClientError } from '@bidplace/api-client';
import { describe, expect, it } from 'vitest';

import { isInfrastructureError } from './classify';
import { INFRASTRUCTURE_ERROR_COPY } from './copy';
import { getUserFacingErrorMessage } from './policy';

describe('mobile infrastructure error policy', () => {
  it('maps network, server and unexpected kinds to canonical copy', () => {
    const network = new ApiClientError('Network request failed', {
      kind: 'network',
      status: 0,
    });
    const server = new ApiClientError('Internal server error', {
      kind: 'server',
      status: 500,
      code: 'internal_error',
    });
    const unexpected = new ApiClientError('Unexpected response from server', {
      kind: 'unexpected_response',
      status: 502,
    });

    expect(isInfrastructureError(network)).toBe(true);
    expect(isInfrastructureError(server)).toBe(true);
    expect(isInfrastructureError(unexpected)).toBe(true);
    expect(getUserFacingErrorMessage(network, 'fallback')).toBe(
      INFRASTRUCTURE_ERROR_COPY,
    );
    expect(getUserFacingErrorMessage(server, 'fallback')).toBe(
      INFRASTRUCTURE_ERROR_COPY,
    );
    expect(getUserFacingErrorMessage(unexpected, 'fallback')).toBe(
      INFRASTRUCTURE_ERROR_COPY,
    );
  });

  it('does not treat validation or unauthorized as infrastructure', () => {
    const unauthorized = new ApiClientError('Unauthorized', {
      kind: 'unauthorized',
      status: 401,
      code: 'unauthorized',
    });
    const validation = new ApiClientError('Email is required', {
      kind: 'validation',
      status: 400,
      code: 'validation_error',
    });

    expect(isInfrastructureError(unauthorized)).toBe(false);
    expect(isInfrastructureError(validation)).toBe(false);
    expect(getUserFacingErrorMessage(unauthorized, 'fallback')).toBe(
      'Unauthorized',
    );
    expect(getUserFacingErrorMessage(validation, 'fallback')).toBe(
      'Email is required',
    );
  });
});
