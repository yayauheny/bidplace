import { ApiErrorCode } from '@bidplace/contracts';
import { HttpStatus } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { turnstileToken as syntheticTurnstileToken } from '../../test/integration/abuse-request';
import { syntheticServerEnv } from '../core/config/synthetic-server-env';
import { AppException } from '../core/errors';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

const emailProof = syntheticTurnstileToken('email_verification');

const rateLimits = { consume: vi.fn().mockReturnValue(true) };
const abuse = {
  sendEmailVerification: vi.fn().mockResolvedValue({ delivery: 'accepted' }),
  verifyEmailCode: vi.fn().mockResolvedValue(undefined),
};

describe('OtpService', () => {
  afterEach(() => {
    vi.clearAllMocks();
    rateLimits.consume.mockReturnValue(true);
  });

  it('keeps the IP gate and delegates a send', async () => {
    const service = new OtpService(
      { ...abuse, consumeRateLimit: rateLimits.consume } as never,
      syntheticServerEnv(),
    );

    await expect(
      service.request('user-id', {
        ip: '203.0.113.8',
        idempotencyKey: 'idem-key-1',
        turnstileToken: emailProof,
      }),
    ).resolves.toEqual({ delivery: 'accepted' });

    expect(rateLimits.consume).toHaveBeenCalledWith('email-otp:request:ip:203.0.113.8', 10, 60_000);
    expect(abuse.sendEmailVerification).toHaveBeenCalledWith({
      userId: 'user-id',
      idempotencyKey: 'idem-key-1',
      turnstileToken: emailProof,
      ip: '203.0.113.8',
    });
  });

  it('does not send when the request IP limit is exhausted', async () => {
    rateLimits.consume.mockReturnValueOnce(false);
    const service = new OtpService(
      { ...abuse, consumeRateLimit: rateLimits.consume } as never,
      syntheticServerEnv(),
    );

    const error = await service.request('user-id', {
      ip: '203.0.113.8',
      idempotencyKey: 'idem-key-1',
      turnstileToken: emailProof,
    }).then(
      () => {
        throw new Error('expected the request IP gate to refuse');
      },
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(AppException);
    expect((error as AppException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect((error as AppException).apiCode).toBe(ApiErrorCode.RATE_LIMITED);
    expect((error as AppException).getResponse()).toMatchObject({
      code: ApiErrorCode.RATE_LIMITED,
      message: 'Too many requests',
    });
    expect(rateLimits.consume).toHaveBeenCalledWith('email-otp:request:ip:203.0.113.8', 10, 60_000);
    expect(abuse.sendEmailVerification).not.toHaveBeenCalled();
  });

  it('keeps the verify IP gate and delegates the code', async () => {
    const service = new OtpService(
      { ...abuse, consumeRateLimit: rateLimits.consume } as never,
      syntheticServerEnv(),
    );

    await service.verify('user-id', '123456', {
      ip: '203.0.113.9',
      idempotencyKey: 'idem-key-2',
    });

    expect(rateLimits.consume).toHaveBeenCalledWith('email-otp:verify:ip:203.0.113.9', 20, 60_000);
    expect(abuse.verifyEmailCode).toHaveBeenCalledWith({
      userId: 'user-id',
      code: '123456',
      idempotencyKey: 'idem-key-2',
    });
  });

  it('does not verify when the verify IP limit is exhausted', async () => {
    rateLimits.consume.mockReturnValueOnce(false);
    const service = new OtpService(
      { ...abuse, consumeRateLimit: rateLimits.consume } as never,
      syntheticServerEnv(),
    );

    const error = await service.verify('user-id', '123456', {
      ip: '203.0.113.9',
      idempotencyKey: 'idem-key-2',
    }).then(
      () => {
        throw new Error('expected the verify IP gate to refuse');
      },
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(AppException);
    expect((error as AppException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect((error as AppException).apiCode).toBe(ApiErrorCode.RATE_LIMITED);
    expect((error as AppException).getResponse()).toMatchObject({
      code: ApiErrorCode.RATE_LIMITED,
      message: 'Too many requests',
    });
    expect(rateLimits.consume).toHaveBeenCalledWith('email-otp:verify:ip:203.0.113.9', 20, 60_000);
    expect(abuse.verifyEmailCode).not.toHaveBeenCalled();
  });

  it('reads the prototype ip getter instead of a spread copy', async () => {
    const request = Object.assign(Object.create({ get ip() { return '203.0.113.44'; } }), {
      socket: { remoteAddress: '10.0.0.8' },
    });
    expect({ ...request }.ip).toBeUndefined();
    const otp = { request: vi.fn().mockResolvedValue({ delivery: 'accepted' }) };
    const controller = new OtpController(otp as never, {} as never);
    await controller.request({ sub: 'user-id' } as never, request, {
      idempotencyKey: 'idem-key-1',
      turnstileToken: emailProof,
    });
    expect(otp.request).toHaveBeenCalledWith(
      'user-id',
      expect.objectContaining({ ip: '203.0.113.44', socket: { remoteAddress: '10.0.0.8' } }),
    );
  });
});
