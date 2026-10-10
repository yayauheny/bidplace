import { ApiErrorCode } from '@bidplace/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { turnstileToken as syntheticTurnstileToken } from '../../test/integration/abuse-request';
import { syntheticServerEnv } from '../core/config/synthetic-server-env';
import { AuthAbuseService } from './auth-abuse.service';
import { mailContentHash, resetContentHash } from './auth-abuse.store';

const emailProof = syntheticTurnstileToken('email_verification');
const resetProof = syntheticTurnstileToken('password_reset');

const user = {
  id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
  email: 'person@example.com',
  emailVerifiedAt: null,
  status: 'active',
};

function createService(mailSend: ReturnType<typeof vi.fn>) {
  const prisma = {
    user: {
      findUnique: vi.fn().mockResolvedValue(user),
    },
  };
  const store = {
    findByKey: vi.fn().mockResolvedValue(null),
    reserveMail: vi.fn(),
    completeMail: vi.fn().mockResolvedValue(undefined),
    suppressReset: vi.fn().mockResolvedValue('stored'),
    recordVerifiedNoSend: vi.fn().mockResolvedValue('stored'),
    verifyEmailCode: vi.fn(),
    evaluateLogin: vi.fn(),
  };
  const turnstile = { verify: vi.fn().mockResolvedValue({ outcome: 'accepted' }) };
  const disposable = { contains: vi.fn().mockReturnValue(false) };
  const service = new AuthAbuseService(
    store as never,
    prisma as never,
    { send: mailSend } as never,
    turnstile as never,
    disposable as never,
    syntheticServerEnv(),
  );
  return { service, prisma, store, turnstile, mailSend };
}

describe('AuthAbuseService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('replays an accepted send without Turnstile or SMTP', async () => {
    const { service, store, turnstile, mailSend } = createService(vi.fn());
    store.findByKey.mockResolvedValue({
      ownerUserId: user.id,
      contentHash: mailContentHash('email_verification_send', user.id, user.email),
      status: 'accepted',
    });

    await expect(
      service.sendEmailVerification({
        userId: user.id,
        idempotencyKey: 'idem-key-1',
        turnstileToken: emailProof,
        ip: '203.0.113.1',
      }),
    ).resolves.toEqual({ delivery: 'accepted' });

    expect(turnstile.verify).not.toHaveBeenCalled();
    expect(mailSend).not.toHaveBeenCalled();
    expect(store.reserveMail).not.toHaveBeenCalled();
  });

  it('keeps an unknown SMTP outcome and does not throw', async () => {
    const mailSend = vi.fn().mockRejectedValue({ command: 'CONN' });
    const { service, store, turnstile } = createService(mailSend);
    store.reserveMail.mockResolvedValue({
      kind: 'reserved',
      operationId: 'op-1',
      secretId: 'secret-1',
      rawSecret: '123456',
    });

    await expect(
      service.sendEmailVerification({
        userId: user.id,
        idempotencyKey: 'idem-key-1',
        turnstileToken: emailProof,
        ip: '203.0.113.1',
      }),
    ).resolves.toEqual({ delivery: 'unknown' });

    expect(turnstile.verify).toHaveBeenCalledOnce();
    expect(store.completeMail).toHaveBeenCalledWith(
      expect.objectContaining({ operationId: 'op-1', outcome: 'unknown' }),
    );
  });

  it('releases a guaranteed SMTP reject', async () => {
    const mailSend = vi.fn().mockRejectedValue({ command: 'CONN', responseCode: 550 });
    const { service, store } = createService(mailSend);
    store.reserveMail.mockResolvedValue({
      kind: 'reserved',
      operationId: 'op-1',
      secretId: 'secret-1',
      rawSecret: '123456',
    });

    await expect(
      service.sendEmailVerification({
        userId: user.id,
        idempotencyKey: 'idem-key-1',
        turnstileToken: emailProof,
        ip: '203.0.113.1',
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.MAIL_REJECTED });

    expect(store.completeMail).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'rejected' }),
    );
  });

  it('reports an already verified address without sending mail', async () => {
    const { service, prisma, store, turnstile, mailSend } = createService(vi.fn());
    prisma.user.findUnique.mockResolvedValue({ ...user, emailVerifiedAt: new Date('2026-10-10T00:00:00.000Z') });

    await expect(
      service.sendEmailVerification({
        userId: user.id,
        idempotencyKey: 'idem-key-1',
        turnstileToken: emailProof,
        ip: '203.0.113.1',
      }),
    ).resolves.toEqual({ delivery: 'already_verified' });
    expect(turnstile.verify).not.toHaveBeenCalled();
    expect(mailSend).not.toHaveBeenCalled();
    expect(store.reserveMail).not.toHaveBeenCalled();
    expect(store.recordVerifiedNoSend).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: user.id,
        email: user.email,
        contentHash: mailContentHash('email_verification_send', user.id, user.email),
      }),
    );

    store.findByKey.mockResolvedValue({
      ownerUserId: user.id,
      contentHash: mailContentHash('email_verification_send', user.id, user.email),
      status: 'suppressed',
    });
    await expect(
      service.sendEmailVerification({
        userId: user.id,
        idempotencyKey: 'idem-key-1',
        turnstileToken: emailProof,
        ip: '203.0.113.1',
      }),
    ).resolves.toEqual({ delivery: 'already_verified' });
    expect(store.recordVerifiedNoSend).toHaveBeenCalledTimes(1);
    expect(mailSend).not.toHaveBeenCalled();

    store.findByKey.mockResolvedValue({
      ownerUserId: user.id,
      contentHash: mailContentHash('email_verification_send', user.id, 'other@example.com'),
      status: 'suppressed',
    });
    await expect(
      service.sendEmailVerification({
        userId: user.id,
        idempotencyKey: 'idem-key-1',
        turnstileToken: emailProof,
        ip: '203.0.113.1',
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.IDEMPOTENCY_CONFLICT });
    expect(mailSend).not.toHaveBeenCalled();
  });

  it('returns a neutral reset without Turnstile when the same address repeats a key', async () => {
    const { service, store, turnstile, mailSend } = createService(vi.fn());
    store.findByKey.mockResolvedValue({
      status: 'suppressed',
      contentHash: resetContentHash('missing@example.com'),
      ownerUserId: null,
    });

    await expect(
      service.sendPasswordReset({
        email: 'missing@example.com',
        idempotencyKey: 'idem-key-1',
        turnstileToken: resetProof,
        ip: '203.0.113.1',
      }),
    ).resolves.toBeUndefined();

    expect(turnstile.verify).not.toHaveBeenCalled();
    expect(mailSend).not.toHaveBeenCalled();
  });

  it('rejects a changed recovery address for known and unknown mailboxes alike', async () => {
    const unknown = createService(vi.fn());
    unknown.store.findByKey.mockResolvedValue({
      status: 'suppressed',
      contentHash: resetContentHash('other@example.com'),
      ownerUserId: null,
    });
    await expect(
      unknown.service.sendPasswordReset({
        email: 'missing@example.com',
        idempotencyKey: 'idem-key-1',
        turnstileToken: resetProof,
        ip: '203.0.113.1',
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.IDEMPOTENCY_CONFLICT });
    expect(unknown.turnstile.verify).not.toHaveBeenCalled();
    expect(unknown.mailSend).not.toHaveBeenCalled();

    const known = createService(vi.fn());
    known.store.findByKey.mockResolvedValue({
      status: 'accepted',
      contentHash: resetContentHash('other@example.com'),
      ownerUserId: user.id,
    });
    await expect(
      known.service.sendPasswordReset({
        email: user.email,
        idempotencyKey: 'idem-key-1',
        turnstileToken: resetProof,
        ip: '203.0.113.1',
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.IDEMPOTENCY_CONFLICT });
    expect(known.turnstile.verify).not.toHaveBeenCalled();
    expect(known.store.reserveMail).not.toHaveBeenCalled();
    expect(known.mailSend).not.toHaveBeenCalled();
  });

  it('does not store a recovery attempt when the key or Turnstile proof fails', async () => {
    const malformed = createService(vi.fn());
    await expect(
      malformed.service.sendPasswordReset({
        email: 'missing@example.com',
        idempotencyKey: 'short',
        turnstileToken: resetProof,
        ip: '203.0.113.1',
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.IDEMPOTENCY_KEY_REQUIRED });
    expect(malformed.store.findByKey).not.toHaveBeenCalled();
    expect(malformed.store.suppressReset).not.toHaveBeenCalled();

    const unproven = createService(vi.fn());
    unproven.prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      unproven.service.sendPasswordReset({
        email: 'missing@example.com',
        idempotencyKey: 'idem-key-1',
        turnstileToken: '',
        ip: '203.0.113.1',
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.TURNSTILE_REQUIRED });
    expect(unproven.store.suppressReset).not.toHaveBeenCalled();
    expect(unproven.store.reserveMail).not.toHaveBeenCalled();
  });

  it('stores a suppressed reset for an unknown address and does not send mail', async () => {
    const { service, prisma, store, mailSend } = createService(vi.fn());
    prisma.user.findUnique.mockResolvedValue(null);

    await service.sendPasswordReset({
      email: 'Missing@Example.com',
      idempotencyKey: 'idem-key-1',
      turnstileToken: resetProof,
      ip: '203.0.113.1',
    });

    expect(store.suppressReset).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'missing@example.com', idempotencyKey: 'idem-key-1' }),
    );
    expect(mailSend).not.toHaveBeenCalled();
  });

  it('logs a reset failure without the secret marker', async () => {
    const marker = 'smtp-secret-marker';
    const failure = new Error(`delivery ${marker}`);
    failure.stack = [
      failure.toString(),
      `    at SMTPConnection.send (/tmp/${marker}.js:4:2)`,
      '    at MailTransport.send (/app/dist/core/mail/smtp-transport.js:40:8)',
    ].join('\n');
    const { service, store } = createService(vi.fn().mockRejectedValue(failure));
    store.reserveMail.mockResolvedValue({
      kind: 'reserved',
      operationId: 'op-1',
      secretId: 'secret-1',
      rawSecret: 'raw-token',
    });
    const loggerError = vi
      .spyOn(
        (service as unknown as { logger: { error: (...args: unknown[]) => void } }).logger,
        'error',
      )
      .mockImplementation(() => undefined);

    await expect(
      service.sendPasswordReset({
        email: user.email,
        idempotencyKey: 'idem-key-1',
        turnstileToken: resetProof,
        ip: '203.0.113.1',
      }),
    ).resolves.toBeUndefined();

    const logged = JSON.stringify(loggerError.mock.calls);
    expect(logged).toContain('outcome=unknown');
    expect(logged).toContain('at=dist/core/mail/smtp-transport.js:40');
    expect(logged).not.toContain(marker);
    expect(store.completeMail).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'unknown' }),
    );
    loggerError.mockRestore();
  });
});
