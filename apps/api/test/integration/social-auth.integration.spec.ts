import { spawn } from 'node:child_process';
import { createServer, request as proxyRequest } from 'node:http';
import { resolve as resolvePath } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import { createTestIdentityProvider } from './test-identity-provider';
import { idempotencyKey, turnstileToken } from './abuse-request';
import { OidcProvidersService } from '../../src/auth/oidc-providers.service';
import { SessionService } from '../../src/auth/session.service';
import { ServiceUnavailableException } from '@nestjs/common';
import { ApiErrorCode } from '@bidplace/contracts';
import { MailTransport } from '../../src/core/mail';
import { PrismaService } from '../../src/core/database';
import { MAIL_SPEND_STATUSES } from '../../src/auth-abuse/auth-abuse.policy';
import { EmailProofService } from '../../src/auth/email-proof.service';
import { AuthAbuseService } from '../../src/auth-abuse/auth-abuse.service';

const legal = {
  agreement: { confirmed: true },
  privacy: { confirmed: true },
  dataConsent: { confirmed: true },
  age18Confirmed: true,
};
vi.mock('../../src/auth/legal-documents', () => ({
  readRegistrationLegalVersion: () => 'synthetic-auth-legal',
  readPublishedLegalDocuments: () => ({
    version: 'synthetic-auth-legal',
    documents: [],
  }),
}));

let database: IntegrationDatabaseContext;
let http: HttpTestApp;
let provider: Awaited<ReturnType<typeof createTestIdentityProvider>>;
let client: HttpTestClient;
let mail: Array<{ to: string; text: string }> = [];
let rejectNextProofMail = false;

beforeAll(async () => {
  database = await createIntegrationDatabaseContext(
    process.env.AUTH_BROWSER_SMOKE === '1' ? 'auth_browser_' : 'itest_',
  );
  provider = await createTestIdentityProvider();
  process.env.GOOGLE_CLIENT_ID = 'google-integration';
  process.env.GOOGLE_CLIENT_SECRET = 'synthetic-provider-secret';
  process.env.GOOGLE_REDIRECT_URI =
    'http://localhost:8081/api/auth/providers/google/callback';
  process.env.TELEGRAM_CLIENT_ID = 'telegram-integration';
  process.env.TELEGRAM_CLIENT_SECRET = 'synthetic-provider-secret';
  process.env.TELEGRAM_REDIRECT_URI =
    'http://localhost:8081/api/auth/providers/telegram/callback';
  if (process.env.AUTH_BROWSER_SMOKE === '1') {
    process.env.API_URL = 'http://127.0.0.1:55442';
    process.env.GOOGLE_REDIRECT_URI =
      'http://127.0.0.1:55442/api/auth/providers/google/callback';
    process.env.TELEGRAM_REDIRECT_URI =
      'http://127.0.0.1:55442/api/auth/providers/telegram/callback';
  }
  process.env.OIDC_TEST_ISSUER = provider.issuer;
  http = await createHttpTestApp(database.databaseUrl);
  vi.spyOn(http.app.get(MailTransport), 'send').mockImplementation(
    async (message) => {
      if (rejectNextProofMail) {
        rejectNextProofMail = false;
        throw Object.assign(new Error('Synthetic browser SMTP refusal'), { responseCode: 550 });
      }
      mail.push({ to: message.to, text: message.text });
    },
  );
});
beforeEach(() => {
  client = new HttpTestClient(
    http.baseUrl,
    undefined,
    `192.0.2.${Math.floor(Math.random() * 200) + 1}`,
  );
  mail = [];
  rejectNextProofMail = false;
});
afterAll(async () => {
  await http?.close();
  await provider?.close();
  await database?.cleanup();
  vi.restoreAllMocks();
});

async function start(kind = 'google', intent = 'login', current = client) {
  const response = await current.post(`/auth/providers/${kind}/start`, {
    intent,
    returnPath: '/account',
  });
  expect(response.status).toBe(201);
  return (await response.json()).url as string;
}
async function callback(url: URL, current = client) {
  return current.get(url.pathname.replace('/api', '') + url.search, {
    redirect: 'manual',
  });
}
function code() {
  const value = /\b(\d{6})\b/.exec(mail.at(-1)?.text ?? '')?.[1];
  if (!value) throw new Error('Expected synthetic code');
  return value;
}
async function sendVerification() {
  return client.post('/auth/onboarding/email/request', {
    idempotencyKey: idempotencyKey(),
    turnstileToken: turnstileToken('email_verification'),
  });
}
async function signup(kind: 'google' | 'telegram', email: string) {
  const url = provider.authorize(await start(kind), {
    sub: kind + '-' + randomUUID(),
    ...(kind === 'google' ? { email, email_verified: true } : {}),
  });
  expect((await callback(url)).headers.get('location')).toBe('/auth/complete');
  const result = await client.post('/auth/onboarding', {
    email,
    slug: 'u-' + randomUUID().slice(0, 10),
    legal,
  });
  expect(result.status).toBe(201);
  return { url, result, body: await result.json() };
}

describe('OIDC, email login and explicit account linking', () => {
  async function proofRequest(intent: 'register' | 'onboarding') {
    const email = `proof-retry-${randomUUID()}@example.test`;
    if (intent === 'onboarding') await signup('telegram', email);
    return {
      email,
      path: intent === 'register' ? '/auth/register/email' : '/auth/onboarding/email',
      input: (key = idempotencyKey(), token?: string) => ({
        ...(intent === 'register' ? { email } : {}),
        idempotencyKey: key,
        turnstileToken: token ?? turnstileToken(intent === 'register' ? 'register' : 'email_verification'),
      }),
      flow: () => database.prisma.authFlow.findFirstOrThrow({ where: { email, stage: 'email' } }),
      operations: () => database.prisma.authAbuseOperation.findMany({ where: { email, purpose: 'email_proof_send' } }),
    };
  }

  const smtpRejection = () => Object.assign(new Error('Synthetic SMTP refusal'), { responseCode: 550 });
  const deferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => { resolve = done; });
    return { promise, resolve };
  };

  it.each(['register', 'onboarding'] as const)(
    'replays a rejected %s proof and immediately accepts a fresh operation without creating an account before proof',
    async (intent) => {
      const proof = await proofRequest(intent);
      const input = proof.input();
      const send = vi.mocked(http.app.get(MailTransport).send);
      send.mockRejectedValueOnce(smtpRejection());
      const rejected = await client.post(proof.path + '/request', input);
      expect(rejected.status).toBe(503);
      expect((await rejected.json()).code).toBe(ApiErrorCode.MAIL_REJECTED);
      const failedFlow = await proof.flow();
      expect(failedFlow).toMatchObject({ codeHash: null, codeExpiresAt: null, codeSentAt: null, codeSends: 1, codeRequestKey: input.idempotencyKey });
      if (intent === 'onboarding') {
        expect(await (await client.get(proof.path + '/state')).json()).toMatchObject({
          sendStatus: 'rejected', resendAvailableAt: null, codeExpiresAt: null,
        });
      }
      const replay = await client.post(proof.path + '/request', proof.input(input.idempotencyKey, 'invalid-proof'));
      expect(replay.status).toBe(503);
      expect((await replay.json()).code).toBe(ApiErrorCode.MAIL_REJECTED);
      expect((await proof.flow()).codeSends).toBe(1);
      expect(await proof.operations()).toHaveLength(1);
      expect(mail).toHaveLength(0);
      expect((await client.post(proof.path + '/request', proof.input(undefined, 'invalid-proof'))).status).toBe(403);
      expect((await client.post(proof.path + '/request', proof.input())).status).toBe(201);
      const nextFlow = await proof.flow();
      expect(nextFlow.codeSends).toBe(2);
      expect(nextFlow.codeHash).not.toBeNull();
      expect(mail).toHaveLength(1);
      expect((await client.post(proof.path + '/request', proof.input(input.idempotencyKey, 'invalid-proof'))).status).toBe(503);
      expect(await proof.flow()).toEqual(nextFlow);
      expect(await database.prisma.authAbuseOperation.count({ where: {
        email: proof.email, purpose: 'email_proof_send', status: { in: [...MAIL_SPEND_STATUSES] },
      } })).toBe(1);
      expect(await database.prisma.user.count({ where: { email: proof.email } })).toBe(0);
      expect(await database.prisma.externalIdentity.count({ where: { user: { email: proof.email } } })).toBe(0);
      expect(await database.prisma.registrationLegalEvidence.count({ where: { user: { email: proof.email } } })).toBe(0);
      expect((await client.post(proof.path + '/verify', { code: code(), idempotencyKey: idempotencyKey() })).status).toBe(201);
      if (intent === 'register') {
        expect((await client.post('/auth/register', {
          email: proof.email, slug: 'proof-' + randomUUID().slice(0, 8), password: 'synthetic-password', legal,
        })).status).toBe(201);
      }
      expect(await database.prisma.user.count({ where: { email: proof.email } })).toBe(1);
    },
  );

  it('counts three rejected reservations against the flow but not shared mail quotas', async () => {
    const proof = await proofRequest('onboarding');
    const keys = [idempotencyKey(), idempotencyKey(), idempotencyKey()];
    const send = vi.mocked(http.app.get(MailTransport).send);
    for (const key of keys) {
      send.mockRejectedValueOnce(smtpRejection());
      expect((await client.post(proof.path + '/request', proof.input(key))).status).toBe(503);
      expect((await client.post(proof.path + '/request', proof.input(key, 'invalid-proof'))).status).toBe(503);
    }
    expect((await proof.flow()).codeSends).toBe(3);
    expect(await proof.operations()).toHaveLength(3);
    expect(await database.prisma.authAbuseOperation.count({ where: {
      email: proof.email, purpose: 'email_proof_send', status: { in: [...MAIL_SPEND_STATUSES] },
    } })).toBe(0);
    expect((await client.post(proof.path + '/request', proof.input())).status).toBe(429);
    for (const key of keys) {
      const replay = await client.post(proof.path + '/request', proof.input(key, 'invalid-proof'));
      expect(replay.status).toBe(503);
      expect((await replay.json()).code).toBe(ApiErrorCode.MAIL_REJECTED);
    }
    expect((await proof.flow()).codeSends).toBe(3);
    expect(mail).toHaveLength(0);
  });

  it.each(['accepted', 'unknown', 'rejected'] as const)(
    'does not wait on reserved SMTP or let its late %s result damage a newer proof',
    async (outcome) => {
      const proof = await proofRequest('onboarding');
      const entered = deferred();
      const release = deferred();
      const input = proof.input();
      const send = vi.mocked(http.app.get(MailTransport).send);
      send.mockImplementationOnce(async () => {
        entered.resolve();
        await release.promise;
        if (outcome === 'rejected') throw smtpRejection();
        if (outcome === 'unknown') throw Object.assign(new Error('Synthetic timeout'), { code: 'ETIMEDOUT' });
      });
      const pending = client.post(proof.path + '/request', input);
      try {
        await entered.promise;
        expect((await proof.operations())[0]?.status).toBe('reserved');
        const replay = await client.post(proof.path + '/request', proof.input(input.idempotencyKey, 'invalid-proof'));
        expect(replay.status).toBe(201);
        expect((await replay.json()).delivery).toBe('unknown');
        expect((await client.post(proof.path + '/request', proof.input())).status).toBe(201);
        expect((await proof.flow()).codeSends).toBe(1);
        expect(await proof.operations()).toHaveLength(1);
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(Date.now() + 61_000));
        expect((await client.post(proof.path + '/request', proof.input())).status).toBe(201);
        const newer = await proof.flow();
        expect(newer.codeSends).toBe(2);
        expect(newer.codeHash).not.toBeNull();
        expect(await proof.operations()).toHaveLength(2);
        release.resolve();
        expect((await pending).status).toBe(outcome === 'rejected' ? 503 : 201);
        expect(await proof.flow()).toEqual(newer);
        const old = (await proof.operations()).find((operation) => operation.idempotencyKey === createHash('sha256').update(`${newer.id}\0${input.idempotencyKey}`).digest('hex'));
        expect(old?.status).toBe(outcome);
        const state = await (await client.get(proof.path + '/state')).json();
        expect(state.sendStatus).toBe('accepted');
        expect(state.resendAvailableAt).not.toBeNull();
        expect((await client.post(proof.path + '/verify', { code: code(), idempotencyKey: idempotencyKey() })).status).toBe(201);
      } finally {
        release.resolve();
        await pending;
        vi.useRealTimers();
      }
    },
  );

  it('rechecks idempotency under the flow lock when another request reserves during CAPTCHA validation', async () => {
    const proof = await proofRequest('onboarding');
    const input = proof.input();
    const captchaEntered = deferred();
    const captchaRelease = deferred();
    const smtpEntered = deferred();
    const smtpRelease = deferred();
    const abuse = http.app.get(AuthAbuseService);
    const validate = abuse.assertOnboardingEmailProof.bind(abuse);
    const captcha = vi.spyOn(abuse, 'assertOnboardingEmailProof').mockImplementationOnce(async (...args) => {
      await validate(...args);
      captchaEntered.resolve();
      await captchaRelease.promise;
    });
    vi.mocked(http.app.get(MailTransport).send).mockImplementationOnce(async () => {
      smtpEntered.resolve();
      await smtpRelease.promise;
    });
    const first = client.post(proof.path + '/request', input);
    let second: Promise<Response> | undefined;
    try {
      await captchaEntered.promise;
      second = client.post(proof.path + '/request', proof.input(input.idempotencyKey));
      await smtpEntered.promise;
      captchaRelease.resolve();
      const replay = await first;
      expect(replay.status).toBe(201);
      expect(await proof.operations()).toHaveLength(1);
      expect((await proof.flow()).codeSends).toBe(1);
      smtpRelease.resolve();
      expect((await second).status).toBe(201);
      expect(await proof.operations()).toHaveLength(1);
    } finally {
      captchaRelease.resolve();
      smtpRelease.resolve();
      await first;
      await second;
      captcha.mockRestore();
    }
  });

  it('rolls back rejection outcome and code invalidation together when finalization fails', async () => {
    const proof = await proofRequest('onboarding');
    const input = proof.input();
    const send = vi.mocked(http.app.get(MailTransport).send);
    await database.prisma.$executeRawUnsafe(`CREATE FUNCTION reject_proof_cleanup() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic cleanup failure'; END $$`);
    await database.prisma.$executeRawUnsafe(`CREATE TRIGGER reject_proof_cleanup BEFORE UPDATE ON auth_flows FOR EACH ROW WHEN (OLD.code_hash IS NOT NULL AND NEW.code_hash IS NULL) EXECUTE FUNCTION reject_proof_cleanup()`);
    try {
      send.mockRejectedValueOnce(smtpRejection());
      const response = await client.post(proof.path + '/request', input);
      expect(response.status).toBeGreaterThanOrEqual(500);
      expect((await response.json()).code).not.toBe(ApiErrorCode.MAIL_REJECTED);
      expect((await proof.operations())[0]?.status).toBe('reserved');
      const flow = await proof.flow();
      expect(flow.codeHash).not.toBeNull();
      expect(flow.codeSentAt).not.toBeNull();
      const replay = await client.post(proof.path + '/request', proof.input(input.idempotencyKey, 'invalid-proof'));
      expect(replay.status).toBe(201);
      expect((await replay.json()).delivery).toBe('unknown');
      expect(await proof.operations()).toHaveLength(1);
      expect((await proof.flow()).codeSends).toBe(1);
      expect(mail).toHaveLength(0);
    } finally {
      await database.prisma.$executeRawUnsafe('DROP TRIGGER reject_proof_cleanup ON auth_flows');
      await database.prisma.$executeRawUnsafe('DROP FUNCTION reject_proof_cleanup()');
    }
  });

  it('reads a coherent proof state while rejection commits between its flow and operation reads', async () => {
    const proof = await proofRequest('onboarding');
    const smtpEntered = deferred();
    const smtpRelease = deferred();
    const stateEntered = deferred();
    const stateRelease = deferred();
    vi.mocked(http.app.get(MailTransport).send).mockImplementationOnce(async () => {
      smtpEntered.resolve();
      await smtpRelease.promise;
      throw smtpRejection();
    });
    const pending = client.post(proof.path + '/request', proof.input());
    const service = http.app.get(EmailProofService);
    const readState = service.deliveryState.bind(service);
    const stateSpy = vi.spyOn(service, 'deliveryState').mockImplementationOnce(async (...args) => {
      stateEntered.resolve();
      await stateRelease.promise;
      return readState(...args);
    });
    let pendingState: Promise<Response> | undefined;
    try {
      await smtpEntered.promise;
      pendingState = client.get(proof.path + '/state');
      await stateEntered.promise;
      smtpRelease.resolve();
      expect((await pending).status).toBe(503);
      stateRelease.resolve();
      const snapshot = await (await pendingState).json();
      expect(snapshot.sendStatus).toBe('unknown');
      expect(snapshot.codeExpiresAt).not.toBeNull();
      expect(snapshot.resendAvailableAt).not.toBeNull();
      expect(await (await client.get(proof.path + '/state')).json()).toMatchObject({
        sendStatus: 'rejected', codeExpiresAt: null, resendAvailableAt: null,
      });
    } finally {
      smtpRelease.resolve();
      stateRelease.resolve();
      await pending;
      await pendingState;
      stateSpy.mockRestore();
    }
  });

  it('reconciles a lost rejection commit acknowledgement through replay without another send', async () => {
    const proof = await proofRequest('onboarding');
    const input = proof.input();
    const entered = deferred();
    const release = deferred();
    vi.mocked(http.app.get(MailTransport).send).mockImplementationOnce(async () => {
      entered.resolve();
      await release.promise;
      throw smtpRejection();
    });
    const pending = client.post(proof.path + '/request', input);
    const prisma = http.app.get(PrismaService);
    const transact = prisma.$transaction.bind(prisma);
    try {
      await entered.promise;
      const transaction = vi.spyOn(prisma, '$transaction').mockImplementationOnce(async (work, options) => {
        await transact(work, options);
        throw new Error('Synthetic lost commit acknowledgement');
      });
      try {
        release.resolve();
        const response = await pending;
        expect(response.status).toBeGreaterThanOrEqual(500);
        expect((await response.json()).code).not.toBe(ApiErrorCode.MAIL_REJECTED);
        expect((await proof.operations())[0]?.status).toBe('rejected');
        expect((await proof.flow()).codeSentAt).toBeNull();
        const replay = await client.post(proof.path + '/request', proof.input(input.idempotencyKey, 'invalid-proof'));
        expect(replay.status).toBe(503);
        expect((await replay.json()).code).toBe(ApiErrorCode.MAIL_REJECTED);
        expect(await proof.operations()).toHaveLength(1);
        expect(mail).toHaveLength(0);
      } finally {
        transaction.mockRestore();
      }
    } finally {
      release.resolve();
      await pending;
    }
  });

  it.each(['accepted', 'unknown'] as const)('retains a usable %s proof and replays it without another SMTP attempt', async (outcome) => {
    const proof = await proofRequest('onboarding');
    const input = proof.input();
    if (outcome === 'unknown') vi.mocked(http.app.get(MailTransport).send).mockImplementationOnce(async (message) => {
      mail.push({ to: message.to, text: message.text });
      throw Object.assign(new Error('Synthetic SMTP timeout'), { code: 'ETIMEDOUT' });
    });
    const sent = await client.post(proof.path + '/request', input);
    expect(sent.status).toBe(201);
    expect((await sent.json()).delivery).toBe(outcome);
    const flow = await proof.flow();
    const replay = await client.post(proof.path + '/request', proof.input(input.idempotencyKey, 'invalid-proof'));
    expect(replay.status).toBe(201);
    expect((await replay.json()).delivery).toBe(outcome);
    expect((await client.post(proof.path + '/request', proof.input())).status).toBe(201);
    expect(await proof.flow()).toEqual(flow);
    expect(await proof.operations()).toHaveLength(1);
    expect(mail).toHaveLength(1);
    expect((await client.post(proof.path + '/verify', { code: code(), idempotencyKey: idempotencyKey() })).status).toBe(201);
  });

  it('keeps a successful SMTP result uncertain when recording acceptance fails without sending again', async () => {
    const proof = await proofRequest('onboarding');
    const input = proof.input();
    const update = vi.spyOn(http.app.get(PrismaService).authAbuseOperation, 'update').mockRejectedValueOnce(
      Object.assign(new Error('Synthetic ledger outage'), { responseCode: 550 }),
    );
    try {
      const response = await client.post(proof.path + '/request', input);
      expect(response.status).toBeGreaterThanOrEqual(500);
      expect((await response.json()).code).not.toBe(ApiErrorCode.MAIL_REJECTED);
      expect((await proof.operations())[0]?.status).toBe('reserved');
      const replay = await client.post(proof.path + '/request', proof.input(input.idempotencyKey, 'invalid-proof'));
      expect(replay.status).toBe(201);
      expect((await replay.json()).delivery).toBe('unknown');
      expect(mail).toHaveLength(1);
      expect((await client.post(proof.path + '/verify', { code: code(), idempotencyKey: idempotencyKey() })).status).toBe(201);
    } finally {
      update.mockRestore();
    }
  });

  it('creates Google Gmail account only after nickname/legal and reuses its identity', async () => {
    const email = `auth-${randomUUID()}@gmail.com`;
    const { body, url } = await signup('google', email);
    expect(body.next).toBe('authenticated');
    expect((await client.get('/auth/me')).status).toBe(200);
    const user = await database.prisma.user.findUniqueOrThrow({
      where: { email },
    });
    expect(user.passwordHash).toBeNull();
    expect(user.emailVerifiedAt).not.toBeNull();
    expect(
      await database.prisma.registrationLegalEvidence.count({
        where: { userId: user.id },
      }),
    ).toBe(1);
    expect((await callback(url)).headers.get('location')).toBe(
      '/login?authError=failed',
    );
    expect(await database.prisma.user.count({ where: { email } })).toBe(1);
  });

  it('requires email proof for Telegram and grants no ordinary principal while pending', async () => {
    const email = `telegram-${randomUUID()}@example.test`;
    const { body } = await signup('telegram', email);
    expect(body.next).toBe('email');
    expect((await client.get('/auth/me')).status).toBe(401);
    expect((await client.get('/auth/email/state')).status).toBe(401);
    expect((await sendVerification()).status).toBe(201);
    const verified = await client.post('/auth/onboarding/email/verify', {
      code: code(),
      idempotencyKey: idempotencyKey(),
    });
    expect(verified.status).toBe(201);
    expect((await verified.json()).next).toBe('authenticated');
    expect((await client.get('/auth/me')).status).toBe(200);
  });

  it('finishes an existing pending identity only after email proof without creating another user', async () => {
    const email = `pending-existing-${randomUUID()}@example.test`;
    const subject = 'pending-' + randomUUID();
    const user = await database.prisma.user.create({
      data: { email, slug: 'pending-' + randomUUID().slice(0, 8) },
    });
    await database.prisma.externalIdentity.create({
      data: { userId: user.id, provider: 'telegram', issuer: provider.issuer, subject, pendingVersion: user.sessionVersion },
    });
    const callbackUrl = provider.authorize(await start('telegram'), { sub: subject });
    expect((await callback(callbackUrl)).headers.get('location')).toBe('/auth/complete');
    expect((await sendVerification()).status).toBe(201);
    expect((await client.post('/auth/onboarding/email/verify', { code: code(), idempotencyKey: idempotencyKey() })).status).toBe(201);
    expect((await (await client.get('/auth/me')).json()).user.id).toBe(user.id);
    expect(await database.prisma.user.count({ where: { email } })).toBe(1);
    expect((await database.prisma.externalIdentity.findFirstOrThrow({ where: { userId: user.id } })).activatedAt).not.toBeNull();
  });

  it.each(['email_verification', 'email_login'])(
    'never accepts %s code for the other purpose',
    async (purpose) => {
      const email = `purpose-${randomUUID()}@example.test`;
      await signup('telegram', email);
      await sendVerification();
      const verificationCode = code();
      if (purpose === 'email_verification') {
        await database.prisma.user.create({
          data: {
            email,
            slug: 'proof-' + randomUUID().slice(0, 8),
            emailVerifiedAt: new Date(),
          },
        });
        await client.post('/auth/email-login/request', {
          email,
          turnstileToken: turnstileToken('email_login'),
          idempotencyKey: idempotencyKey(),
        });
        const response = await client.post('/auth/email-login/verify', {
          code: verificationCode,
          idempotencyKey: idempotencyKey(),
        });
        expect(response.status).toBe(403);
      } else {
        const consumed = await client.post('/auth/onboarding/email/verify', {
          code: verificationCode,
          idempotencyKey: idempotencyKey(),
        });
        expect(consumed.status).toBe(201);
        await client.post('/auth/logout');
        await client.post('/auth/email-login/request', {
          email,
          turnstileToken: turnstileToken('email_login'),
          idempotencyKey: idempotencyKey(),
        });
        expect(
          (
            await client.post('/auth/email/verify', {
              code: code(),
              idempotencyKey: idempotencyKey(),
            })
          ).status,
        ).toBe(401);
      }
    },
  );

  it('logs Google users in by email code without another User and rejects replay/cross-browser proof', async () => {
    const email = `code-${randomUUID()}@gmail.com`;
    const { body } = await signup('google', email);
    await client.post('/auth/logout');
    const request = await client.post('/auth/email-login/request', {
      email,
      turnstileToken: turnstileToken('email_login'),
      idempotencyKey: idempotencyKey(),
    });
    expect(request.status).toBe(201);
    const value = code();
    const other = new HttpTestClient(http.baseUrl);
    expect(
      (
        await other.post('/auth/email-login/verify', {
          code: value,
          idempotencyKey: idempotencyKey(),
        })
      ).status,
    ).toBe(403);
    const key = idempotencyKey();
    const result = await client.post('/auth/email-login/verify', {
      code: value,
      idempotencyKey: key,
    });
    expect(result.status).toBe(201);
    expect((await result.json()).user.id).toBe(body.user.id);
    expect(
      (
        await client.post('/auth/email-login/verify', {
          code: value,
          idempotencyKey: key,
        })
      ).status,
    ).toBe(403);
    expect(await database.prisma.user.count({ where: { email } })).toBe(1);
  });

  it('does not register unknown email or reveal account existence through code request', async () => {
    const email = `unknown-${randomUUID()}@example.test`;
    const result = await client.post('/auth/email-login/request', {
      email,
      turnstileToken: turnstileToken('email_login'),
      idempotencyKey: idempotencyKey(),
    });
    expect(result.status).toBe(201);
    expect(Object.keys(await result.json()).sort()).toEqual([
      'ok',
      'resendAvailableAt',
      'serverNow',
    ]);
    expect(mail).toEqual([]);
    expect(
      await database.prisma.user.findUnique({ where: { email } }),
    ).toBeNull();
  });

  it('persists the same failed verification and pause for known and unknown addresses', async () => {
    const knownEmail = `neutral-known-${randomUUID()}@example.test`;
    await database.prisma.user.create({
      data: { email: knownEmail, slug: 'neutral-' + randomUUID().slice(0, 8), emailVerifiedAt: new Date() },
    });
    for (const email of [knownEmail, `neutral-unknown-${randomUUID()}@example.test`]) {
      client = new HttpTestClient(http.baseUrl, undefined, `198.51.100.${email === knownEmail ? 21 : 22}`);
      expect((await client.post('/auth/email-login/request', {
        email, turnstileToken: turnstileToken('email_login'), idempotencyKey: idempotencyKey(),
      })).status).toBe(201);
      const wrongCode = mail.at(-1) ? (code() === '000000' ? '111111' : '000000') : '000000';
      const keys: string[] = [];
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const key = idempotencyKey();
        keys.push(key);
        const result = await client.post('/auth/email-login/verify', { code: wrongCode, idempotencyKey: key });
        expect(result.status).toBe(403);
        expect((await result.json()).code).toBe(ApiErrorCode.EMAIL_LOGIN_REJECTED);
      }
      const operations = await database.prisma.authAbuseOperation.findMany({
        where: { purpose: 'email_login_verify', idempotencyKey: { in: keys } },
        orderBy: { createdAt: 'asc' },
      });
      expect(operations.map((operation) => operation.status)).toEqual([
        'invalid', 'invalid', 'invalid', 'invalid', 'paused', 'paused',
      ]);
      expect((await client.get('/auth/me')).status).toBe(401);
    }
  });

  it.each(['rejected', 'unavailable'] as const)(
    'does not spend admission or cooldown on %s Turnstile',
    async (outcome) => {
      const email = `captcha-${randomUUID()}@example.test`;
      await database.prisma.user.create({
        data: {
          email,
          slug: 'captcha-' + randomUUID().slice(0, 8),
          passwordHash: null,
          emailVerifiedAt: new Date(),
        },
      });
      const failed = await client.post('/auth/email-login/request', {
        email,
        idempotencyKey: idempotencyKey(),
        turnstileToken:
          outcome === 'rejected' ? 'invalid-proof' : 'turnstile-unavailable',
      });
      expect(failed.status).toBe(outcome === 'rejected' ? 403 : 503);
      expect(
        await database.prisma.authAbuseOperation.count({
          where: { email, purpose: 'email_login_request' },
        }),
      ).toBe(0);
      const sent = await client.post('/auth/email-login/request', {
        email,
        idempotencyKey: idempotencyKey(),
        turnstileToken: turnstileToken('email_login'),
      });
      expect(sent.status).toBe(201);
      expect(mail).toHaveLength(1);
    },
  );

  it('does not duplicate a send when an uncertain result is retried with the same operation', async () => {
    const email = `uncertain-${randomUUID()}@example.test`;
    await database.prisma.user.create({
      data: {
        email,
        slug: 'uncertain-' + randomUUID().slice(0, 8),
        passwordHash: null,
        emailVerifiedAt: new Date(),
      },
    });
    vi.spyOn(http.app.get(MailTransport), 'send').mockImplementationOnce(
      async (message) => {
        mail.push({ to: message.to, text: message.text });
        throw Object.assign(new Error('Synthetic mail timeout'), {
          code: 'ETIMEDOUT',
        });
      },
    );
    const input = {
      email,
      idempotencyKey: idempotencyKey(),
      turnstileToken: turnstileToken('email_login'),
    };
    expect((await client.post('/auth/email-login/request', input)).status).toBe(
      201,
    );
    expect((await client.post('/auth/email-login/request', input)).status).toBe(
      201,
    );
    expect(mail).toHaveLength(1);
    expect(
      await database.prisma.authAbuseOperation.count({
        where: { email, purpose: 'email_login_send', status: 'unknown' },
      }),
    ).toBe(1);
  });

  it.each([
    'unknown',
    'unverified',
    'banned',
    'invalid',
    'expired',
    'paused',
    'revoked',
  ] as const)(
    'does not disclose %s account or code state in login verification',
    async (state) => {
      const email = `neutral-verify-${randomUUID()}@example.test`;
      const user =
        state === 'unknown'
          ? null
          : await database.prisma.user.create({
              data: {
                email,
                slug: 'nv-' + randomUUID().slice(0, 8),
                passwordHash: null,
                emailVerifiedAt: state === 'unverified' ? null : new Date(),
                status: state === 'banned' ? 'banned' : 'active',
              },
            });
      expect(
        (
          await client.post('/auth/email-login/request', {
            email,
            idempotencyKey: idempotencyKey(),
            turnstileToken: turnstileToken('email_login'),
          })
        ).status,
      ).toBe(201);
      const correct = mail.length ? code() : '000000';
      const wrong = String((Number(correct) + 1) % 1_000_000).padStart(6, '0');
      if (state === 'expired')
        await database.prisma.emailVerificationCode.updateMany({
          where: { userId: user!.id },
          data: { expiresAt: new Date(Date.now() - 1000) },
        });
      if (state === 'revoked')
        await database.prisma.user.update({
          where: { id: user!.id },
          data: { sessionVersion: { increment: 1 } },
        });
      if (state === 'paused') {
        for (let attempt = 0; attempt < 5; attempt++)
          expect(
            (
              await client.post('/auth/email-login/verify', {
                code: wrong,
                idempotencyKey: idempotencyKey(),
              })
            ).status,
          ).toBe(403);
        const counter = await database.prisma.authAbuseCounter.findFirstOrThrow(
          {
            where: {
              scope: 'otp_verify',
              subjectHash: createHash('sha256')
                .update('otp_verify\n' + user!.id)
                .digest('hex'),
            },
          },
        );
        expect(counter.failures).toBe(5);
        expect(counter.pausedUntil!.getTime()).toBeGreaterThan(Date.now());
      }
      const rejected = await client.post('/auth/email-login/verify', {
        code: state === 'paused' || state === 'revoked' ? correct : wrong,
        idempotencyKey: idempotencyKey(),
      });
      expect(rejected.status).toBe(403);
      const { requestId, ...body } = await rejected.json();
      expect(requestId).toEqual(expect.any(String));
      expect(body).toEqual({
        status: 403,
        code: ApiErrorCode.EMAIL_LOGIN_REJECTED,
        message: 'Email login could not be verified',
      });
      expect((await client.get('/auth/me')).status).toBe(401);
    },
  );

  it.each(['replay', 'fresh'] as const)(
    'preserves neutral browser admission after revoke for a %s operation',
    async (operation) => {
      for (const known of [true, false]) {
        client = new HttpTestClient(http.baseUrl);
        const email = `admission-${randomUUID()}@example.test`;
        const user = known
          ? await database.prisma.user.create({
              data: {
                email,
                slug: 'admission-' + randomUUID().slice(0, 8),
                passwordHash: null,
                emailVerifiedAt: new Date(),
              },
            })
          : null;
        const input = {
          email,
          idempotencyKey: idempotencyKey(),
          turnstileToken: turnstileToken('email_login'),
        };
        const original = await client.post('/auth/email-login/request', input);
        expect(original.status).toBe(201);
        const initial = await original.json();
        if (user)
          await database.prisma.user.update({
            where: { id: user.id },
            data: { sessionVersion: { increment: 1 } },
          });
        const response = await client.post(
          '/auth/email-login/request',
          operation === 'replay'
            ? input
            : {
                ...input,
                idempotencyKey: idempotencyKey(),
                turnstileToken: turnstileToken('email_login'),
              },
        );
        expect(response.status).toBe(201);
        const again = await response.json();
        expect(again.resendAvailableAt).toBe(initial.resendAvailableAt);
        expect(
          (await (await client.get('/auth/email-login/state')).json())
            .resendAvailableAt,
        ).toBe(initial.resendAvailableAt);
        expect(
          await database.prisma.authAbuseOperation.count({
            where: { email, purpose: 'email_login_request' },
          }),
        ).toBe(1);
      }
    },
  );

  it('admits a fresh login code after revoke without accepting the old proof', async () => {
    const email = `renewed-${randomUUID()}@example.test`;
    const user = await database.prisma.user.create({
      data: {
        email,
        slug: 'renew-' + randomUUID().slice(0, 8),
        passwordHash: null,
        emailVerifiedAt: new Date(),
      },
    });
    const request = () =>
      client.post('/auth/email-login/request', {
        email,
        idempotencyKey: idempotencyKey(),
        turnstileToken: turnstileToken('email_login'),
      });
    expect((await request()).status).toBe(201);
    const oldCode = code();
    const oldFlow = await database.prisma.authFlow.findFirstOrThrow({
      where: { email, stage: 'email_login' },
    });
    await database.prisma.user.update({
      where: { id: user.id },
      data: { sessionVersion: { increment: 1 } },
    });
    expect(
      (
        await client.post('/auth/email-login/verify', {
          code: oldCode,
          idempotencyKey: idempotencyKey(),
        })
      ).status,
    ).toBe(403);
    await database.prisma.authAbuseOperation.updateMany({
      where: { email },
      data: { createdAt: new Date(Date.now() - 301_000) },
    });
    expect((await request()).status).toBe(201);
    const freshCode = code();
    const freshFlow = await database.prisma.authFlow.findFirstOrThrow({
      where: { email, stage: 'email_login' },
    });
    expect(freshFlow.id).not.toBe(oldFlow.id);
    expect(freshFlow.version).toBe(1);
    expect(
      (
        await database.prisma.authFlow.findUniqueOrThrow({
          where: { id: oldFlow.id },
        })
      ).stage,
    ).toBe('cancelled');
    expect(mail).toHaveLength(2);
    const signedIn = await client.post('/auth/email-login/verify', {
      code: freshCode,
      idempotencyKey: idempotencyKey(),
    });
    expect(signedIn.status).toBe(201);
    expect((await signedIn.json()).user.id).toBe(user.id);
  });

  it.each(['cancelled', 'exchange', 'expired', 'collision'] as const)(
    'preserves the trusted destination after provider %s and retry',
    async (failure) => {
      const response = await client.post('/auth/providers/google/start', {
        intent: 'login',
        returnPath: '/profile?edit=1',
      });
      const authorization = new URL((await response.json()).url);
      const url = provider.authorize(
        authorization.href,
        failure === 'collision'
          ? {
              email: `collision-${randomUUID()}@gmail.com`,
              email_verified: true,
            }
          : {},
      );
      if (failure === 'cancelled') {
        url.searchParams.set('error', 'access_denied');
        url.searchParams.delete('code');
      }
      if (failure === 'exchange') url.searchParams.set('code', 'invalid-code');
      if (failure === 'expired')
        await database.prisma.authFlow.updateMany({
          where: { stage: 'provider', returnPath: '/profile?edit=1' },
          data: { expiresAt: new Date(Date.now() - 1000) },
        });
      if (failure === 'collision') {
        // An authoritative provider proof can collide, but never auto-link.
        const email = `existing-${randomUUID()}@gmail.com`;
        await database.prisma.user.create({
          data: {
            email,
            slug: 'collision-' + randomUUID().slice(0, 8),
            passwordHash: null,
            emailVerifiedAt: new Date(),
          },
        });
        const colliding = provider.authorize(authorization.href, {
          email,
          email_verified: true,
        });
        url.search = colliding.search;
      }
      const location = (await callback(url)).headers.get('location')!;
      const redirect = new URL(location, 'http://localhost');
      expect(redirect.pathname).toBe('/login');
      expect(redirect.searchParams.get('redirectTo')).toBe('/profile?edit=1');
      expect(redirect.searchParams.get('authError')).toBe(
        failure === 'cancelled'
          ? 'cancelled'
          : failure === 'collision'
            ? 'link_required'
            : 'failed',
      );
      expect((await client.get('/auth/me')).status).toBe(401);
      const retry = await client.post('/auth/providers/google/start', {
        intent: 'login',
        returnPath: redirect.searchParams.get('redirectTo'),
      });
      expect(
        (
          await callback(provider.authorize((await retry.json()).url))
        ).headers.get('location'),
      ).toBe('/auth/complete');
      expect(
        (await (await client.get('/auth/onboarding')).json()).returnPath,
      ).toBe('/profile?edit=1');
    },
  );

  it('requires provider proof and allowed email even without a second registration CAPTCHA', async () => {
    expect(
      (
        await client.post('/auth/onboarding', {
          email: 'proof@example.test',
          slug: 'proof-required',
          legal,
        })
      ).status,
    ).toBe(401);
    await callback(provider.authorize(await start('telegram')));
    const denied = await client.post('/auth/onboarding', {
      email: 'proof@mailinator.com',
      slug: 'proof-required',
      legal,
    });
    expect(denied.status).toBe(400);
    expect((await denied.json()).code).toBe(ApiErrorCode.DISPOSABLE_EMAIL);
    expect((await client.get('/auth/me')).status).toBe(401);
  });

  it.each([
    { iss: 'https://wrong.example' },
    { aud: 'wrong-client' },
    { nonce: 'wrong-nonce' },
    { exp: 1 },
  ])('rejects invalid OIDC claims %j', async (overrides) => {
    const url = provider.authorize(await start(), overrides);
    expect((await callback(url)).headers.get('location')).toBe(
      '/login?authError=failed&redirectTo=%2Faccount',
    );
    expect((await client.get('/auth/me')).status).toBe(401);
  });

  it('rejects an invalid ID-token signature and does not trust the token endpoint alone', async () => {
    expect(
      (await callback(provider.authorize(await start(), {}, true))).headers.get(
        'location',
      ),
    ).toBe('/login?authError=failed&redirectTo=%2Faccount');
  });

  it('rejects an authorization code bound to another PKCE challenge', async () => {
    const authorization = new URL(await start());
    authorization.searchParams.set('code_challenge', 'another-challenge');
    const result = await callback(provider.authorize(authorization.href));
    expect(result.headers.get('location')).toBe(
      '/login?authError=failed&redirectTo=%2Faccount',
    );
    expect((await client.get('/auth/me')).status).toBe(401);
  });

  it('allows a fresh attempt after the provider denies authorization', async () => {
    const authorization = new URL(await start());
    const denied = new URL(authorization.searchParams.get('redirect_uri')!);
    denied.searchParams.set('error', 'access_denied');
    denied.searchParams.set('state', authorization.searchParams.get('state')!);
    expect((await callback(denied)).headers.get('location')).toBe(
      '/login?authError=cancelled&redirectTo=%2Faccount',
    );
    expect(
      (await callback(provider.authorize(await start()))).headers.get(
        'location',
      ),
    ).toBe('/auth/complete');
  });

  it('does not create an account or identity before social email proof', async () => {
    const email = `recovery-${randomUUID()}@example.test`;
    await signup('telegram', email);
    await sendVerification();
    expect(await database.prisma.user.count({ where: { email } })).toBe(0);
    expect(
      await database.prisma.externalIdentity.count({
        where: { user: { email } },
      }),
    ).toBe(0);
    expect((await client.get('/auth/me')).status).toBe(401);
  });

  it('rejects wrong state before token exchange and old callbacks after a new start', async () => {
    const old = provider.authorize(await start());
    old.searchParams.set('state', 'wrong');
    expect((await callback(old)).headers.get('location')).toBe(
      '/login?authError=failed&redirectTo=%2Faccount',
    );
    const next = provider.authorize(await start());
    expect((await callback(old)).headers.get('location')).toBe(
      '/login?authError=failed&redirectTo=%2Faccount',
    );
    expect((await callback(next)).headers.get('location')).toBe(
      '/auth/complete',
    );
  });

  it('requires explicit linking for an existing email and never transfers another identity', async () => {
    const email = `link-${randomUUID()}@gmail.com`;
    const { body } = await signup('google', email);
    const owner = body.user.id;
    const linkUrl = provider.authorize(await start('telegram', 'link'), {
      sub: 'telegram-link-' + randomUUID(),
    });
    expect((await callback(linkUrl)).headers.get('location')).toBe('/account');
    expect(
      (await (await client.get('/auth/connections')).json()).connections,
    ).toEqual(
      expect.arrayContaining([
        { provider: 'google' },
        { provider: 'telegram' },
      ]),
    );
    await client.post('/auth/logout');
    const newGoogle = provider.authorize(await start(), {
      email,
      email_verified: true,
    });
    expect((await callback(newGoogle)).headers.get('location')).toBe(
      '/login?authError=link_required&redirectTo=%2Faccount',
    );
    expect(await database.prisma.user.count({ where: { email } })).toBe(1);
    expect(
      (await database.prisma.user.findUniqueOrThrow({ where: { email } })).id,
    ).toBe(owner);
  });

  it('does not attach a social identity to an existing account after email proof', async () => {
    const email = `pending-${randomUUID()}@example.test`;
    await signup('telegram', email);
    await sendVerification();
    const value = code();
    const user = await database.prisma.user.create({
      data: {
        email,
        slug: 'existing-' + randomUUID().slice(0, 8),
        emailVerifiedAt: new Date(),
      },
    });
    expect(
      (
        await client.post('/auth/onboarding/email/verify', {
          code: value,
          idempotencyKey: idempotencyKey(),
        })
      ).status,
    ).toBe(409);
    expect(
      await database.prisma.externalIdentity.count({ where: { userId: user.id } }),
    ).toBe(0);
    expect((await client.get('/auth/me')).status).toBe(401);
  });
  it('returns the same account on a later provider login', async () => {
    const email = `return-${randomUUID()}@gmail.com`;
    const { body } = await signup('google', email);
    const identity = await database.prisma.externalIdentity.findFirstOrThrow({
      where: { userId: body.user.id },
    });
    await client.post('/auth/logout');
    const response = await callback(
      provider.authorize(await start(), { sub: identity.subject }),
    );
    expect(response.headers.get('location')).toBe('/account');
    expect((await (await client.get('/auth/me')).json()).user.id).toBe(
      body.user.id,
    );
  });

  it('rejects a link callback after logout and login into another account', async () => {
    const { body } = await signup('google', `switch-${randomUUID()}@gmail.com`);
    const pending = provider.authorize(await start('telegram', 'link'));
    await client.post('/auth/logout');
    await signup('google', `other-${randomUUID()}@gmail.com`);
    expect((await callback(pending)).headers.get('location')).toBe(
      '/login?authError=failed',
    );
    expect(
      await database.prisma.externalIdentity.count({
        where: { userId: body.user.id, provider: 'telegram' },
      }),
    ).toBe(0);
  });

  it('admits only one concurrent callback and one account creation', async () => {
    const url = provider.authorize(await start());
    const responses = await Promise.all([callback(url), callback(url)]);
    expect(
      responses.map((value) => value.headers.get('location')).sort(),
    ).toEqual([
      '/auth/complete',
      '/login?authError=failed&redirectTo=%2Faccount',
    ]);
    const input = {
      email: `race-${randomUUID()}@example.test`,
      slug: 'race-' + randomUUID().slice(0, 8),
      legal,
    };
    const completed = await Promise.all([
      client.post('/auth/onboarding', input),
      client.post('/auth/onboarding', input),
    ]);
    expect(completed.filter((value) => value.status === 201)).toHaveLength(1);
    expect(
      await database.prisma.user.count({ where: { email: input.email } }),
    ).toBe(0);
    await sendVerification();
    expect(
      (
        await client.post('/auth/onboarding/email/verify', {
          code: code(),
          idempotencyKey: idempotencyKey(),
        })
      ).status,
    ).toBe(201);
    expect(await database.prisma.user.count({ where: { email: input.email } })).toBe(1);
  });

  it('does not retain a provider proof when cancelled or superseded', async () => {
    const pending = provider.authorize(await start());
    expect((await client.post('/auth/onboarding/cancel')).status).toBe(201);
    expect((await callback(pending)).headers.get('location')).toBe(
      '/login?authError=failed',
    );
    expect((await client.get('/auth/onboarding')).status).toBe(401);
    const cancelled = provider.authorize(await start());
    cancelled.searchParams.set('error', 'access_denied');
    cancelled.searchParams.delete('code');
    expect((await callback(cancelled)).headers.get('location')).toBe(
      '/login?authError=cancelled&redirectTo=%2Faccount',
    );
  });

  it('does not trust third-party Google email or an edited authoritative email', async () => {
    const { body } = await signup(
      'google',
      `outside-${randomUUID()}@example.test`,
    );
    expect(body.next).toBe('email');
    client = new HttpTestClient(http.baseUrl);
    expect(
      (
        await callback(
          provider.authorize(await start(), {
            email: `proof-${randomUUID()}@gmail.com`,
            email_verified: true,
          }),
        )
      ).headers.get('location'),
    ).toBe('/auth/complete');
    const response = await client.post('/auth/onboarding', {
      email: `edited-${randomUUID()}@example.test`,
      slug: 'edit-' + randomUUID().slice(0, 8),
      legal,
    });
    expect((await response.json()).next).toBe('email');
    expect((await client.get('/auth/me')).status).toBe(401);
  });

  it('rejects email codes issued before revocation or expiry', async () => {
    const email = `stale-${randomUUID()}@gmail.com`;
    const { body } = await signup('google', email);
    await client.post('/auth/logout');
    await client.post('/auth/email-login/request', {
      email,
      turnstileToken: turnstileToken('email_login'),
      idempotencyKey: idempotencyKey(),
    });
    const value = code();
    await database.prisma.user.update({
      where: { id: body.user.id },
      data: { sessionVersion: { increment: 1 } },
    });
    expect(
      (
        await client.post('/auth/email-login/verify', {
          code: value,
          idempotencyKey: idempotencyKey(),
        })
      ).status,
    ).not.toBe(201);
    expect((await client.get('/auth/me')).status).toBe(401);
  });

  it('retries a consumed email code after session save failure without another User', async () => {
    const email = `retry-${randomUUID()}@gmail.com`;
    const { body } = await signup('google', email);
    await client.post('/auth/logout');
    await client.post('/auth/email-login/request', {
      email,
      turnstileToken: turnstileToken('email_login'),
      idempotencyKey: idempotencyKey(),
    });
    const input = { code: code(), idempotencyKey: idempotencyKey() };
    const save = vi
      .spyOn(http.app.get(SessionService), 'save')
      .mockRejectedValueOnce(
        new ServiceUnavailableException('Synthetic store outage'),
      );
    expect((await client.post('/auth/email-login/verify', input)).status).toBe(
      503,
    );
    expect((await client.get('/auth/me')).status).toBe(401);
    const response = await client.post('/auth/email-login/verify', input);
    expect(response.status).toBe(201);
    expect((await response.json()).user.id).toBe(body.user.id);
    expect(await database.prisma.user.count({ where: { email } })).toBe(1);
    save.mockRestore();
  });

  it.each(['//outside.test', '/\\outside.test', 'https://outside.test'])(
    'rejects unsafe return path %s',
    async (returnPath) => {
      expect(
        (
          await client.post('/auth/providers/google/start', {
            intent: 'login',
            returnPath,
          })
        ).status,
      ).toBe(409);
    },
  );

  it('cancels an in-flight link when password login switches accounts without logout', async () => {
    const { body } = await signup(
      'google',
      `barrier-${randomUUID()}@gmail.com`,
    );
    const second = await database.prisma.user.create({
      data: {
        email: `password-${randomUUID()}@example.test`,
        slug: 'pass-' + randomUUID().slice(0, 8),
        passwordHash: await http.app
          .get(
            (await import('../../src/auth/password-hasher.service'))
              .PasswordHasherService,
          )
          .hash('synthetic-password'),
        emailVerifiedAt: new Date(),
      },
    });
    const url = provider.authorize(await start('telegram', 'link'));
    const providers = http.app.get(OidcProvidersService);
    const exchange = providers.exchange.bind(providers);
    let release!: () => void;
    let entered!: () => void;
    const waiting = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const spy = vi
      .spyOn(providers, 'exchange')
      .mockImplementationOnce(async (...args) => {
        entered();
        await gate;
        return exchange(...args);
      });
    const pending = callback(url);
    await waiting;
    const login = await client.post('/auth/login', {
      email: second.email,
      password: 'synthetic-password',
    });
    expect(login.status).toBe(201);
    release();
    expect((await pending).headers.get('location')).toBe(
      '/login?authError=failed&redirectTo=%2Faccount',
    );
    expect(
      await database.prisma.externalIdentity.count({
        where: { userId: body.user.id, provider: 'telegram' },
      }),
    ).toBe(0);
    expect((await (await client.get('/auth/me')).json()).user.id).toBe(
      second.id,
    );
    spy.mockRestore();
  });

  it('expires email login codes and never revives them with a resend or replay', async () => {
    const email = `expired-${randomUUID()}@gmail.com`;
    const { body } = await signup('google', email);
    await client.post('/auth/logout');
    await client.post('/auth/email-login/request', {
      email,
      turnstileToken: turnstileToken('email_login'),
      idempotencyKey: idempotencyKey(),
    });
    const input = { code: code(), idempotencyKey: idempotencyKey() };
    await database.prisma.emailVerificationCode.updateMany({
      where: { userId: body.user.id, purpose: 'email_login' },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect((await client.post('/auth/email-login/verify', input)).status).toBe(
      403,
    );
    expect((await client.post('/auth/email-login/verify', input)).status).toBe(
      403,
    );
    expect((await client.get('/auth/me')).status).toBe(401);
  });

  it('persists neutral resend state across reload for known and unknown email', async () => {
    const email = `timer-${randomUUID()}@gmail.com`;
    await signup('google', email);
    await client.post('/auth/logout');
    for (const address of [email, `unknown-${randomUUID()}@example.test`]) {
      const input = {
        email: address,
        turnstileToken: turnstileToken('email_login'),
        idempotencyKey: idempotencyKey(),
      };
      const response = await client.post('/auth/email-login/request', input);
      const state = await (await client.get('/auth/email-login/state')).json();
      expect(response.status).toBe(201);
      expect(state.email).toBe(address);
      expect(
        Date.parse(state.resendAvailableAt) - Date.parse(state.serverNow),
      ).toBeGreaterThan(55_000);
      const again = await client.post('/auth/email-login/request', {
        ...input,
        idempotencyKey: idempotencyKey(),
        turnstileToken: turnstileToken('email_login'),
      });
      expect(again.status).toBe(201);
      expect((await again.json()).resendAvailableAt).toBe(
        state.resendAvailableAt,
      );
    }
  });
  it.runIf(process.env.AUTH_BROWSER_SMOKE === '1')(
    'runs Chromium and WebKit against the isolated auth HTTP harness',
    async () => {
      const proxy = createServer((request, response) => {
        if (
          request.url === '/api/auth/onboarding/email/request' &&
          request.headers['x-test-proof-mail-outcome'] === 'rejected'
        ) rejectNextProofMail = true;
        if (request.url === '/__test/mail') {
          response.setHeader('Cache-Control', 'no-store');
          response.setHeader('Content-Type', 'application/json');
          const value = /\b(\d{6})\b/.exec(mail.at(-1)?.text ?? '')?.[1];
          response.statusCode = value ? 200 : 404;
          response.end(
            JSON.stringify(
              value ? { code: value } : { error: 'No test message' },
            ),
          );
          return;
        }
        const upstream = new URL(
          request.url ?? '/',
          request.url?.startsWith('/api/')
            ? http.baseUrl
            : 'http://127.0.0.1:55441',
        );
        const forwarded = proxyRequest(
          upstream,
          {
            method: request.method,
            headers: { ...request.headers, host: upstream.host },
          },
          (result) => {
            response.writeHead(result.statusCode ?? 502, result.headers);
            result.pipe(response);
          },
        );
        forwarded.on('error', () => {
          response.statusCode = 502;
          response.end('Test upstream unavailable');
        });
        request.pipe(forwarded);
      });
      await new Promise<void>((resolve, reject) => {
        proxy.once('error', reject);
        proxy.listen(55442, '127.0.0.1', resolve);
      });
      try {
        await new Promise<void>((resolve, reject) => {
          const child = spawn(
            'pnpm',
            [
              '--filter',
              '@bidplace/mobile',
              'exec',
              'playwright',
              'test',
              '--config=playwright.auth-abuse.config.ts',
              '--grep=web auth completion',
            ],
            {
              cwd: resolvePath(__dirname, '../../../..'),
              env: {
                ...process.env,
                E2E_WEB_BASE_URL: 'http://127.0.0.1:55442',
                E2E_API_BASE_URL: 'http://127.0.0.1:55442',
                E2E_DATABASE_URL: database.databaseUrl,
                E2E_TEST_EMAIL_FILE:
                  '/tmp/bidplace-auth-completion-synthetic-mail.jsonl',
                E2E_EVIDENCE_DIR: '/tmp/bidplace-auth-completion-browser',
                E2E_AUTH_COOKIE_PROXY_PORT: '55442',
                E2E_AUTH_COOKIE_PROXY_CONTROL_PORT: '55443',
              },
              stdio: 'inherit',
            },
          );
          child.once('error', reject);
          child.once('exit', (status) =>
            status === 0
              ? resolve()
              : reject(new Error('Auth browser acceptance failed')),
          );
        });
      } finally {
        proxy.closeAllConnections();
        await new Promise<void>((resolve) => proxy.close(() => resolve()));
      }
    },
    300_000,
  );

  it('keeps code requests neutral when an existing account is revoked between requests', async () => {
    const email = `neutral-${randomUUID()}@gmail.com`;
    const { body } = await signup('google', email);
    await client.post('/auth/logout');
    const input = {
      email,
      turnstileToken: turnstileToken('email_login'),
      idempotencyKey: idempotencyKey(),
    };
    expect((await client.post('/auth/email-login/request', input)).status).toBe(
      201,
    );
    await database.prisma.user.update({
      where: { id: body.user.id },
      data: { sessionVersion: { increment: 1 }, status: 'banned' },
    });
    const revoked = await client.post('/auth/email-login/request', {
      ...input,
      idempotencyKey: idempotencyKey(),
      turnstileToken: turnstileToken('email_login'),
    });
    expect(revoked.status).toBe(201);
    expect(Object.keys(await revoked.json()).sort()).toEqual([
      'ok',
      'resendAvailableAt',
      'serverNow',
    ]);
  });

  it('cancels an anonymous provider attempt on logout', async () => {
    const url = provider.authorize(await start());
    expect((await client.post('/auth/logout')).status).toBe(201);
    expect((await callback(url)).headers.get('location')).toBe(
      '/login?authError=failed',
    );
    expect((await client.get('/auth/onboarding')).status).toBe(401);
  });

  it('rejects a late provider start after password login replaces the session', async () => {
    const { body: first } = await signup(
      'google',
      `race-a-${randomUUID()}@gmail.com`,
    );
    const second = await database.prisma.user.create({
      data: {
        email: `race-b-${randomUUID()}@example.test`,
        slug: 'race-' + randomUUID().slice(0, 8),
        emailVerifiedAt: new Date(),
        passwordHash: await http.app
          .get(
            (await import('../../src/auth/password-hasher.service'))
              .PasswordHasherService,
          )
          .hash('synthetic-password'),
      },
    });
    const providers = http.app.get(OidcProvidersService);
    const authorization = providers.authorization.bind(providers);
    let release!: () => void;
    let entered!: () => void;
    const waiting = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const spy = vi
      .spyOn(providers, 'authorization')
      .mockImplementationOnce(async (...args) => {
        entered();
        await gate;
        return authorization(...args);
      });
    try {
      const pending = client.post('/auth/providers/telegram/start', {
        intent: 'link',
        returnPath: '/account',
      });
      await waiting;
      const login = await client.post('/auth/login', {
        email: second.email,
        password: 'synthetic-password',
      });
      expect(login.status).toBe(201);
      expect((await (await client.get('/auth/me')).json()).user.id).toBe(
        second.id,
      );
      release();
      const late = await pending;
      expect(late.status).toBe(401);
      const after = await (await client.get('/auth/me')).json();
      expect(after.user.id).toBe(second.id);
      expect(
        await database.prisma.externalIdentity.count({
          where: {
            userId: first.user.id,
            provider: 'telegram',
            activatedAt: { not: null },
          },
        }),
      ).toBe(0);
    } finally {
      release();
      spy.mockRestore();
    }
  });

  it('does not restore a rotated anonymous session from a late provider start', async () => {
    const user = await database.prisma.user.create({
      data: {
        email: `anonymous-race-${randomUUID()}@example.test`,
        slug: 'race-' + randomUUID().slice(0, 8),
        emailVerifiedAt: new Date(),
        passwordHash: await http.app
          .get(
            (await import('../../src/auth/password-hasher.service'))
              .PasswordHasherService,
          )
          .hash('synthetic-password'),
      },
    });
    await start();
    expect((await client.post('/auth/onboarding/cancel')).status).toBe(201);
    const providers = http.app.get(OidcProvidersService);
    const authorization = providers.authorization.bind(providers);
    let release!: () => void;
    let entered!: () => void;
    const waiting = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const spy = vi
      .spyOn(providers, 'authorization')
      .mockImplementationOnce(async (...args) => {
        entered();
        await gate;
        return authorization(...args);
      });
    try {
      const pending = client.post('/auth/providers/telegram/start', {
        intent: 'login',
        returnPath: '/account',
      });
      await waiting;
      expect(
        (
          await client.post('/auth/login', {
            email: user.email,
            password: 'synthetic-password',
          })
        ).status,
      ).toBe(201);
      release();
      expect((await pending).status).toBe(401);
      expect((await (await client.get('/auth/me')).json()).user.id).toBe(user.id);
    } finally {
      release();
      spy.mockRestore();
    }
  });
});
