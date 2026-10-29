import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiErrorCode } from '@bidplace/contracts';

import {
  syntheticProductionServerEnv,
  syntheticServerEnv,
} from '../core/config/synthetic-server-env';
import { AuthController } from './auth.controller';

const sessions = {
  login: vi.fn(),
  destroy: vi.fn().mockResolvedValue(undefined),
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('AuthController nickname availability', () => {
  it.each([2, 3, 20, 21])(
    'checks only valid %i-character new nicknames',
    async (length) => {
      const authService = {
        slugAvailability: vi.fn().mockResolvedValue({ available: true }),
      };
      const controller = new AuthController(
        authService as never,
        sessions as never,
        {} as never,
        syntheticServerEnv(),
      );
      const slug = 'a'.repeat(length);
      if (length >= 3 && length <= 20) {
        await expect(controller.slugAvailability(slug)).resolves.toEqual({
          available: true,
        });
        expect(authService.slugAvailability).toHaveBeenCalledWith(slug);
      } else {
        await expect(controller.slugAvailability(slug)).rejects.toMatchObject({
          apiCode: ApiErrorCode.VALIDATION_ERROR,
          status: 400,
        });
        expect(authService.slugAvailability).not.toHaveBeenCalled();
      }
    },
  );
});

describe('AuthController public legal reader', () => {
  it('serves the current published documents without an authenticated user', () => {
    const documents = {
      version: 'portfolio-legal-2026-10-12',
      documents: [
        {
          id: 'agreement',
          title: 'Пользовательское соглашение',
          version: 'portfolio-legal-2026-10-12',
          markdown: '# Соглашение',
        },
      ],
    };
    const service = { getLegalDocuments: vi.fn(() => documents) };
    const controller = new AuthController(
      service as never,
      sessions as never,
      {} as never,
      syntheticServerEnv(),
    );

    expect(controller.getLegalDocuments()).toEqual(documents);
    expect(service.getLegalDocuments).toHaveBeenCalledOnce();
  });
});

describe('AuthController logout', () => {
  it('clears the cookie without invalidating a server session when auth is absent', async () => {
    const authService = {
      logout: vi.fn(),
    };
    const controller = new AuthController(
      authService as never,
      sessions as never,
      {} as never,
      syntheticServerEnv(),
    );
    const response = {
      clearCookie: vi.fn(),
    };

    await expect(
      controller.logout(undefined, {} as never, response),
    ).resolves.toEqual({
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
      sessions as never,
      {} as never,
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
      },
      {} as never,
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
      sessions as never,
      {} as never,
      syntheticProductionServerEnv(),
    );
    const response = {
      clearCookie: vi.fn(),
    };

    await controller.logout(undefined, {} as never, response);

    expect(response.clearCookie).toHaveBeenCalledWith('bidplace_session', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });
  });
});
