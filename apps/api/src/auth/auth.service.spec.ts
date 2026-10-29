import { PrismaService } from '../core/database';
import {
  ConflictException,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { syntheticServerEnv } from '../core/config/synthetic-server-env';
import { authCredentialsSelect, authUserContractSelect } from './auth.mapper';
import { AuthService } from './auth.service';
import { PasswordHasherService } from './password-hasher.service';
import {
  readPublishedLegalDocuments,
  readRegistrationLegalVersion,
} from './legal-documents';

vi.mock('./legal-documents', () => ({
  readRegistrationLegalVersion: vi.fn(() => 'portfolio-legal-2026-10-12'),
  readPublishedLegalDocuments: vi.fn(() => ({
    version: 'portfolio-legal-2026-10-12',
    documents: [],
  })),
}));

const legal = {
  agreement: {
    version: 'portfolio-legal-2026-10-12',
    confirmed: true as const,
  },
  privacy: { version: 'portfolio-legal-2026-10-12', confirmed: true as const },
  dataConsent: {
    version: 'portfolio-legal-2026-10-12',
    confirmed: true as const,
  },
  age18Confirmed: true as const,
};

type PrismaUser = {
  id: string;
  email: string;
  passwordHash: string;
  phone: string;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  acceptedRulesVersion?: string | null;
  displayName: string | null;
  slug: string | null;
  role: 'admin' | 'user';
  status: 'active' | 'banned';
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
};

function createPrismaUser(overrides: Partial<PrismaUser> = {}): PrismaUser {
  return {
    id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    email: 'seller@example.com',
    passwordHash: 'hashed-password',
    phone: '+15555550123',
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    acceptedRulesVersion: null,
    displayName: 'Demo Seller',
    slug: null,
    role: 'user',
    status: 'active',
    sessionVersion: 0,
    createdAt: new Date('2026-07-13T12:00:00.000Z'),
    updatedAt: new Date('2026-07-13T12:00:00.000Z'),
    ...overrides,
  };
}

describe('AuthService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const prisma = new PrismaService();
  const userMocks = {
    findFirst: vi.spyOn(prisma.user, 'findFirst'),
    create: vi.spyOn(prisma.user, 'create'),
    findUnique: vi.spyOn(prisma.user, 'findUnique'),
    update: vi.spyOn(prisma.user, 'update'),
    updateMany: vi.spyOn(prisma.user, 'updateMany'),
  };

  const passwordHasher = new PasswordHasherService();
  const passwordMocks = {
    hash: vi.spyOn(passwordHasher, 'hash'),
    verify: vi.spyOn(passwordHasher, 'verify'),
    dummyHash: vi.spyOn(passwordHasher, 'dummyHash').mockResolvedValue('dummy-hash'),
  };

  const abuse = {
    assertRegistration: vi.fn().mockResolvedValue(undefined),
    assertRegistrationEmail: vi.fn(),
    assessLogin: vi.fn(async (input: { passwordAccepted: boolean }) =>
      input.passwordAccepted
        ? { outcome: 'accepted' as const }
        : { outcome: 'invalid' as const },
    ),
  };

  const service = new AuthService(
    prisma,
    passwordHasher,
    abuse as never,
    syntheticServerEnv(),
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers a new user with a hashed password', async () => {
    userMocks.findFirst.mockResolvedValue(null);
    userMocks.create.mockResolvedValue(
      createPrismaUser({
        email: 'new-seller@example.com',
        passwordHash: 'hashed-value',
      }),
    );
    passwordMocks.hash.mockResolvedValue('hashed-value');

    const result = await service.register({
      email: 'New-Seller@Example.com',
      password: 'super-secret',
      slug: 'demo-seller',
      legal,
    });

    expect(userMocks.create).toHaveBeenCalledWith({
      data: {
        email: 'new-seller@example.com',
        slug: 'demo-seller',
        displayName: null,
        passwordHash: 'hashed-value',
        status: 'active',
        sessionVersion: 0,
        emailVerifiedAt: expect.any(Date),
        phoneVerifiedAt: null,
        registrationLegalEvidence: {
          create: {
            agreementVersion: legal.agreement.version,
            agreementAcceptedAt: expect.any(Date),
            privacyVersion: legal.privacy.version,
            privacyAcknowledgedAt: expect.any(Date),
            dataConsentVersion: legal.dataConsent.version,
            dataConsentedAt: expect.any(Date),
            age18ConfirmedAt: expect.any(Date),
          },
        },
      },
      select: authCredentialsSelect,
    });
    expect(result).toEqual({
      sessionVersion: 0,
      user: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        email: 'new-seller@example.com',
        phone: '+15555550123',
        emailVerifiedAt: null,
        phoneVerifiedAt: null,
        acceptedRulesVersion: null,
        displayName: 'Demo Seller',
        slug: null,
        role: 'user',
        status: 'active',
        createdAt: '2026-07-13T12:00:00.000Z',
        updatedAt: '2026-07-13T12:00:00.000Z',
      },
    });
  });

  it('creates the account and records the server revision when reading documents is unavailable', async () => {
    vi.mocked(readPublishedLegalDocuments).mockImplementationOnce(() => {
      throw new ServiceUnavailableException();
    });
    userMocks.findFirst.mockResolvedValue(null);
    userMocks.create.mockResolvedValue(createPrismaUser());
    passwordMocks.hash.mockResolvedValue('hashed-value');
    await service.register({
      email: 'new-user@example.com',
      password: 'registration-password',
      slug: 'new-user',
      legal: {
        agreement: { confirmed: true },
        privacy: { confirmed: true },
        dataConsent: { confirmed: true },
        age18Confirmed: true,
      },
    });
    expect(
      userMocks.create.mock.calls[0]?.[0].data.registrationLegalEvidence?.create,
    ).toMatchObject({
      agreementVersion: 'portfolio-legal-2026-10-12',
      privacyVersion: 'portfolio-legal-2026-10-12',
      dataConsentVersion: 'portfolio-legal-2026-10-12',
      age18ConfirmedAt: expect.any(Date),
    });
    expect(readPublishedLegalDocuments).not.toHaveBeenCalled();
    vi.mocked(readPublishedLegalDocuments).mockReset().mockReturnValue({
      version: 'portfolio-legal-2026-10-12',
      documents: [],
    });
  });

  it('rejects a stale legal version without creating a user or checking abuse', async () => {
    vi.mocked(readRegistrationLegalVersion).mockReturnValueOnce(
      'new-legal-version',
    );
    await expect(
      service.register({
        email: 'seller@example.com',
        password: 'super-secret',
        slug: 'seller',
        legal,
      }),
    ).rejects.toMatchObject({ status: 409 });
    expect(userMocks.create).not.toHaveBeenCalled();
    expect(abuse.assertRegistration).not.toHaveBeenCalled();
  });

  it('does not issue a session when the atomic user/evidence insert fails', async () => {
    userMocks.findFirst.mockResolvedValue(null);
    userMocks.create.mockRejectedValueOnce(
      new Error('registration evidence insert failed'),
    );
    passwordMocks.hash.mockResolvedValue('hash');
    await expect(
      service.register({
        email: 'seller@example.com',
        password: 'super-secret',
        slug: 'seller',
        legal,
      }),
    ).rejects.toThrow('registration evidence insert failed');
  });

  it('rejects duplicate email or phone on registration', async () => {
    userMocks.findFirst.mockResolvedValue(createPrismaUser());

    await expect(
      service.register({
        email: 'seller@example.com',
        password: 'super-secret',
        slug: 'demo-seller',
        legal,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an unknown email after a dummy password check', async () => {
    userMocks.findUnique.mockResolvedValue(null);
    passwordMocks.verify.mockResolvedValue(false);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'super-secret',
      }),
    ).rejects.toMatchObject({ status: 401, message: 'Invalid credentials' });

    expect(passwordHasher.dummyHash).toHaveBeenCalled();
    expect(passwordMocks.verify).toHaveBeenCalledWith(
      'dummy-hash',
      'super-secret',
    );
    expect(abuse.assessLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordAccepted: false,
        email: 'missing@example.com',
      }),
    );
    expect(userMocks.update).not.toHaveBeenCalled();
  });

  it('rejects a wrong password with the stored hash', async () => {
    userMocks.findUnique.mockResolvedValue(
      createPrismaUser({ passwordHash: 'hashed-login-password' }),
    );
    passwordMocks.verify.mockResolvedValue(false);

    await expect(
      service.login({
        email: 'seller@example.com',
        password: 'super-secret',
      }),
    ).rejects.toMatchObject({ status: 401, message: 'Invalid credentials' });

    expect(passwordHasher.dummyHash).not.toHaveBeenCalled();
    expect(passwordMocks.verify).toHaveBeenCalledWith(
      'hashed-login-password',
      'super-secret',
    );
    expect(abuse.assessLogin).toHaveBeenCalledWith(
      expect.objectContaining({ passwordAccepted: false }),
    );
    expect(userMocks.update).not.toHaveBeenCalled();
  });

  it('logs a user in with a valid password', async () => {
    userMocks.findUnique.mockResolvedValue(
      createPrismaUser({
        email: 'login@example.com',
        passwordHash: 'hashed-login-password',
      }),
    );
    passwordMocks.verify.mockResolvedValue(true);

    const result = await service.login({
      email: 'Login@Example.com',
      password: 'super-secret',
    });

    expect(passwordMocks.verify).toHaveBeenCalledWith(
      'hashed-login-password',
      'super-secret',
    );
    expect(userMocks.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      sessionVersion: 0,
      user: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        email: 'login@example.com',
        phone: '+15555550123',
        emailVerifiedAt: null,
        phoneVerifiedAt: null,
        acceptedRulesVersion: null,
        displayName: 'Demo Seller',
        slug: null,
        role: 'user',
        status: 'active',
        createdAt: '2026-07-13T12:00:00.000Z',
        updatedAt: '2026-07-13T12:00:00.000Z',
      },
    });
  });

  it('returns the current user from me', async () => {
    userMocks.findUnique.mockResolvedValue(createPrismaUser());

    const result = await service.me('2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1');

    expect(result).toEqual({
      id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      email: 'seller@example.com',
      phone: '+15555550123',
      emailVerifiedAt: null,
      phoneVerifiedAt: null,
      acceptedRulesVersion: null,
      displayName: 'Demo Seller',
      slug: null,
      role: 'user',
      status: 'active',
      createdAt: '2026-07-13T12:00:00.000Z',
      updatedAt: '2026-07-13T12:00:00.000Z',
    });
    expect(userMocks.findUnique).toHaveBeenCalledWith({
      where: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      },
      select: authUserContractSelect,
    });
  });

  it('returns the stored slug when a second claim loses the race', async () => {
    userMocks.updateMany.mockResolvedValue({ count: 0 });
    userMocks.findUnique.mockResolvedValue(createPrismaUser({ slug: 'kept-name' }));

    await expect(
      service.claimSlug('2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1', 'other-name'),
    ).resolves.toEqual({ slug: 'kept-name' });
    expect(userMocks.updateMany).toHaveBeenCalledWith({
      where: { id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1', slug: null },
      data: { slug: 'other-name' },
    });
  });

  it('rejects banned users on login', async () => {
    userMocks.findUnique.mockResolvedValue(
      createPrismaUser({
        email: 'banned@example.com',
        status: 'banned',
      }),
    );

    await expect(
      service.login({
        email: 'banned@example.com',
        password: 'super-secret',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(passwordHasher.dummyHash).toHaveBeenCalled();
    expect(passwordMocks.verify).toHaveBeenCalledWith(
      'dummy-hash',
      'super-secret',
    );
    expect(abuse.assessLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordAccepted: false,
        email: 'banned@example.com',
      }),
    );
    expect(userMocks.update).not.toHaveBeenCalled();
  });

  it('reports slug availability without reserving the nickname', async () => {
    userMocks.findUnique.mockResolvedValueOnce(null);
    await expect(service.slugAvailability('author')).resolves.toEqual({
      available: true,
    });
    expect(userMocks.create).not.toHaveBeenCalled();
    expect(userMocks.update).not.toHaveBeenCalled();

    userMocks.findUnique.mockResolvedValueOnce(createPrismaUser({ id: 'taken' }));
    await expect(service.slugAvailability('author')).resolves.toEqual({
      available: false,
    });
    expect(userMocks.create).not.toHaveBeenCalled();
  });

  it('reads service rules from the injected config', async () => {
    vi.stubEnv('SERVICE_RULES_TEXT', 'from-process');
    const rulesService = new AuthService(
      prisma,
      passwordHasher,
      abuse as never,
      syntheticServerEnv({
        SERVICE_RULES_TEXT: 'from-snapshot',
      }),
    );

    await expect(rulesService.getRules()).resolves.toEqual({
      rules: expect.objectContaining({
        text: 'from-snapshot',
      }),
    });
  });

  it('invalidates existing sessions on logout', async () => {
    userMocks.update.mockResolvedValue(createPrismaUser());

    await service.logout('2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1');

    expect(userMocks.update).toHaveBeenCalledWith({
      where: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      },
      data: {
        sessionVersion: {
          increment: 1,
        },
      },
    });
  });
});

it.each(['malformed', 'storage failure'])(
  'preserves a new account when analytics attribution has %s',
  async (failure) => {
    const { signAnalyticsBrowser, ANALYTICS_BROWSER_COOKIE } =
      await import('../analytics/browser-attribution');
    const env = syntheticServerEnv({ ANALYTICS_WEB_ENABLED: 'true' });
    const user = createPrismaUser();
    const prisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(user),
        findUniqueOrThrow: vi
          .fn()
          .mockRejectedValue(new Error('fixture storage failure')),
      },
      acquisitionAttribution: { updateMany: vi.fn() },
    };
    const service = new AuthService(
      prisma as never,
      { hash: vi.fn().mockResolvedValue('fixture hash') } as never,
      { assertRegistrationEmail: vi.fn() } as never,
      env,
    );
    const id = '00000000-0000-4000-8000-000000000001';
    const proof =
      failure === 'malformed'
        ? `${id}.${'é'.repeat(43)}`
        : signAnalyticsBrowser(id, env);
    const result = await service.register(
      {
        email: 'created@example.com',
        password: 'password123',
        slug: 'created',
        legal,
      },
      `${ANALYTICS_BROWSER_COOKIE}=${proof}`,
    );
    expect(prisma.user.create).toHaveBeenCalledOnce();
    expect(result.user.id).toBe(user.id);
    expect(prisma.acquisitionAttribution.updateMany).not.toHaveBeenCalled();
  },
);
