import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  syntheticProductionServerEnv,
  syntheticServerEnv,
} from '../core/config/synthetic-server-env';
import { AuthController } from './auth.controller';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('AuthController logout', () => {
  it('clears the cookie without invalidating a server session when auth is absent', async () => {
    const authService = {
      logout: vi.fn(),
    };
    const controller = new AuthController(
      authService as never,
      syntheticServerEnv(),
    );
    const response = {
      clearCookie: vi.fn(),
    };

    await expect(controller.logout(undefined, response)).resolves.toEqual({
      ok: true,
    });

    expect(authService.logout).not.toHaveBeenCalled();
    expect(response.clearCookie).toHaveBeenCalledWith('bidplace_session', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
  });

  it('invalidates a valid authenticated session before clearing its cookie', async () => {
    const authService = {
      logout: vi.fn(),
    };
    const controller = new AuthController(
      authService as never,
      syntheticServerEnv(),
    );
    const response = {
      clearCookie: vi.fn(),
    };

    await controller.logout(
      {
        sub: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        email: 'seller@example.com',
        role: 'user',
        sessionVersion: 2,
        iat: 1,
        exp: 2_000_000_000,
      },
      response,
    );

    expect(authService.logout).toHaveBeenCalledWith(
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    );
    expect(response.clearCookie).toHaveBeenCalledOnce();
  });

  it('sets the secure cookie flag from the injected production profile', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('APP_ENV', 'local');

    const authService = {
      logout: vi.fn(),
    };
    const controller = new AuthController(
      authService as never,
      syntheticProductionServerEnv(),
    );
    const response = {
      clearCookie: vi.fn(),
    };

    await controller.logout(undefined, response);

    expect(response.clearCookie).toHaveBeenCalledWith('bidplace_session', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });
  });
});
