import { ApiClientError } from '@bidplace/api-client';
import { ApiErrorCode } from '@bidplace/contracts';
import { describe, expect, it, vi } from 'vitest';

import { isInfrastructureError } from './classify';
import { INFRASTRUCTURE_ERROR_COPY } from './copy';
import { getUserFacingErrorMessage, logInfrastructureError } from './policy';

describe('mobile infrastructure error policy', () => {
  it('maps network, server and unexpected kinds to canonical copy', () => {
    const network = new ApiClientError('Network request failed', {
      kind: 'network',
      status: 0,
    });
    const server = new ApiClientError('Internal server error', {
      kind: 'server',
      status: 500,
      code: ApiErrorCode.INTERNAL_ERROR,
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
      code: ApiErrorCode.UNAUTHORIZED,
    });
    const validation = new ApiClientError('Email is required', {
      kind: 'validation',
      status: 400,
      code: ApiErrorCode.VALIDATION_ERROR,
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

  it('trusts api-client kind without a second INTERNAL_ERROR branch', () => {
    const serverWithoutCode = new ApiClientError('Internal server error', {
      kind: 'server',
      status: 500,
    });

    expect(isInfrastructureError(serverWithoutCode)).toBe(true);
    expect(getUserFacingErrorMessage(serverWithoutCode, 'fallback')).toBe(
      INFRASTRUCTURE_ERROR_COPY,
    );
  });

  it('logs infrastructure diagnostics without console.error', () => {
    const network = new ApiClientError('Network request failed', {
      kind: 'network',
      status: 0,
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    logInfrastructureError(network, 'query');

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith(
      '[infrastructure-error]',
      expect.objectContaining({
        surface: 'query',
        kind: 'network',
        status: 0,
        code: null,
        requestId: null,
        message: 'Network request failed',
      }),
    );

    errorSpy.mockRestore();
    warnSpy.mockRestore();
    infoSpy.mockRestore();
  });
});
