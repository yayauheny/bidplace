/**
 * @vitest-environment jsdom
 */
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '@bidplace/api-client';
import { ApiErrorCode, type EmailVerificationState, type User } from '@bidplace/contracts';

import { flush } from '../../testing/dom';
import { advanceAuthEpoch, authKeys } from '../../lib/query-cache';
import { useEmailVerification } from './use-email-verification';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const OWNER_ID = '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1';
const LOCAL = Date.parse('2026-10-10T08:00:30.000Z');

const harness = vi.hoisted(() => ({
  user: null as User | null,
  verified: 0,
  emailVerificationState: vi.fn<(...args: unknown[]) => Promise<EmailVerificationState>>(),
  requestEmailVerification: vi.fn<(...args: unknown[]) => Promise<{ ok: true; delivery: string }>>(),
  verifyEmailVerification: vi.fn<(...args: unknown[]) => Promise<{ ok: true }>>(),
  changeUnverifiedEmail: vi.fn<(...args: unknown[]) => Promise<{ user: User }>>(),
  me: vi.fn<(...args: unknown[]) => Promise<{ user: User }>>(),
}));

vi.mock('../../providers/auth-provider', () => ({
  useAuth: () => ({ user: harness.user }),
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    auth: {
      emailVerificationState: harness.emailVerificationState,
      requestEmailVerification: harness.requestEmailVerification,
      verifyEmailVerification: harness.verifyEmailVerification,
      changeUnverifiedEmail: harness.changeUnverifiedEmail,
      me: harness.me,
    },
  }),
}));

function account(overrides: Partial<User> = {}): User {
  return {
    id: OWNER_ID,
    email: 'author@example.com',
    phone: null,
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    acceptedRulesVersion: 'MVP_RULES_V1',
    displayName: 'Author',
    slug: 'author',
    role: 'user',
    status: 'active',
    createdAt: '2026-10-10T08:00:00.000Z',
    updatedAt: '2026-10-10T08:00:00.000Z',
    ...overrides,
  };
}

function verificationState(overrides: Partial<EmailVerificationState> = {}): EmailVerificationState {
  return {
    serverNow: '2026-10-10T08:00:00.000Z',
    email: 'author@example.com',
    verified: false,
    sendStatus: 'none',
    codeExpiresAt: null,
    resendAvailableAt: null,
    pausedUntil: null,
    quotaResetsAt: null,
    ...overrides,
  };
}

function networkError() {
  return new ApiClientError('synthetic-network', {
    kind: 'network',
    status: 0,
    code: null,
  });
}

function Probe({ focused }: { focused: boolean }) {
  const [focus, setFocus] = useState(focused);
  const verification = useEmailVerification({
    focused: focus,
    onVerified: () => {
      harness.verified += 1;
    },
  });
  return createElement(
    'div',
    null,
    createElement('p', null, `status:${verification.readStatus}`),
    createElement('p', null, `send:${verification.serverState?.sendStatus ?? 'nostate'}`),
    createElement('p', null, `resend:${verification.remaining.resend}`),
    createElement('p', null, `pause:${verification.remaining.pause}`),
    createElement('p', null, `codeLeft:${verification.remaining.code}`),
    createElement('p', null, `quota:${verification.remaining.quota}`),
    createElement('p', null, `reason:${verification.reason?.kind ?? 'none'}`),
    createElement('p', null, `entered:${verification.code}`),
    createElement('p', null, `locked:${verification.verifyLocked ? 'yes' : 'no'}`),
    createElement('p', null, `busy:${verification.sending || verification.verifying || verification.correcting ? 'yes' : 'no'}`),
    createElement('p', null, `retrySend:${verification.retrySendPending ? 'yes' : 'no'}`),
    createElement('button', { type: 'button', onClick: () => setFocus(false) }, 'blur'),
    createElement('button', { type: 'button', onClick: () => void verification.retry() }, 'retry'),
    createElement('button', { type: 'button', onClick: () => void verification.send('proof-token') }, 'send'),
    createElement('button', { type: 'button', onClick: () => void verification.send('proof-token', true) }, 'send-new'),
    createElement('button', { type: 'button', onClick: () => void verification.send('') }, 'send-empty'),
    createElement('button', { type: 'button', onClick: () => void verification.verify() }, 'verify'),
    createElement('button', { type: 'button', onClick: () => verification.setCode('12345') }, 'short'),
    createElement('button', { type: 'button', onClick: () => verification.setCode('123456') }, 'code'),
    createElement('button', { type: 'button', onClick: () => verification.setCode('654321') }, 'edit'),
    createElement('button', { type: 'button', onClick: () => verification.setEditingEmail('not-an-email') }, 'bad-email'),
    createElement('button', { type: 'button', onClick: () => verification.setEditingEmail('temp@mailinator.com') }, 'disposable-email'),
    createElement('button', { type: 'button', onClick: () => verification.setEditingEmail('next@example.com') }, 'next-email'),
    createElement('button', { type: 'button', onClick: () => void verification.correct() }, 'correct'),
  );
}

function click(container: HTMLElement, label: string) {
  const button = [...container.querySelectorAll('button')].find((item) => item.textContent === label);
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing ${label}`);
  button.click();
}

describe('useEmailVerification', () => {
  let root: Root | null = null;
  let client: QueryClient | null = null;

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    root = null;
    client = null;
    document.body.replaceChildren();
    harness.user = null;
    harness.verified = 0;
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  function render(focused = true) {
    harness.user = account();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(authKeys.session, harness.user);
    client = queryClient;
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => {
      root?.render(createElement(QueryClientProvider, { client: queryClient }, createElement(Probe, { focused })));
    });
    return container;
  }

  function replaceUser(user: User) {
    harness.user = user;
    client?.setQueryData(authKeys.session, user);
    act(() => {
      root?.render(createElement(
        QueryClientProvider,
        { client: client as QueryClient },
        createElement(Probe, { focused: true }),
      ));
    });
  }

  it('reads authorized state before any send and ignores a retired or unmounted reply', async () => {
    harness.emailVerificationState.mockRejectedValueOnce(networkError());
    const container = render();
    await flush();
    expect(container.textContent).toContain('status:error');
    expect(container.textContent).toContain('reason:read-error');
    expect(container.textContent).toContain('retrySend:no');
    expect(container.textContent).not.toContain('synthetic-network');
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();

    harness.emailVerificationState.mockResolvedValue(verificationState());
    await act(async () => {
      click(container, 'retry');
    });
    await flush();
    expect(container.textContent).toContain('status:ready');
    expect(container.textContent).toContain('send:none');
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    expect(harness.emailVerificationState).toHaveBeenCalledTimes(2);

    const pending: Array<(state: EmailVerificationState) => void> = [];
    const signals: AbortSignal[] = [];
    harness.emailVerificationState.mockImplementation((...args: unknown[]) => {
      const signal = (args[0] as { signal?: AbortSignal } | undefined)?.signal;
      if (signal) signals.push(signal);
      return new Promise((resolve) => pending.push(resolve));
    });
    await act(async () => {
      click(container, 'retry');
    });
    await act(async () => {
      click(container, 'retry');
    });
    expect(pending).toHaveLength(2);
    expect(signals[0]?.aborted).toBe(true);
    await act(async () => {
      pending[1]?.(verificationState({ sendStatus: 'none' }));
    });
    await flush();
    await act(async () => {
      pending[0]?.(verificationState({ sendStatus: 'accepted', email: 'stale@example.com' }));
    });
    await flush();
    expect(container.textContent).toContain('send:none');
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    expect(harness.me).not.toHaveBeenCalled();

    const late: Array<(state: EmailVerificationState) => void> = [];
    harness.emailVerificationState.mockImplementation(
      () => new Promise((resolve) => late.push(resolve)),
    );
    await act(async () => {
      click(container, 'retry');
    });
    act(() => {
      root?.unmount();
    });
    root = null;
    await act(async () => {
      late[0]?.(verificationState({ verified: true }));
    });
    await flush();
    expect(harness.verified).toBe(0);
    expect(harness.me).not.toHaveBeenCalled();
    expect(client?.getQueryData<User>(authKeys.session)?.emailVerifiedAt).toBeNull();
  });

  it('counts server deadlines from the server clock and does not read state on each local tick', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(LOCAL);
    harness.emailVerificationState.mockResolvedValue(verificationState({
      resendAvailableAt: '2026-10-10T08:01:00.000Z',
      pausedUntil: '2026-10-10T08:05:00.000Z',
      codeExpiresAt: '2026-10-10T08:02:00.000Z',
      quotaResetsAt: '2026-10-10T08:10:00.000Z',
    }));
    const container = render();
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.textContent).toContain('resend:60');
    expect(container.textContent).toContain('pause:300');
    expect(container.textContent).toContain('codeLeft:120');
    expect(container.textContent).toContain('quota:600');
    const reads = harness.emailVerificationState.mock.calls.length;
    await act(async () => {
      click(container, 'send');
      click(container, 'verify');
    });
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    expect(harness.verifyEmailVerification).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(container.textContent).toContain('resend:59');
    await act(async () => {
      vi.setSystemTime(LOCAL + 20_000);
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(container.textContent).toContain('resend:40');
    expect(harness.emailVerificationState).toHaveBeenCalledTimes(reads);

    await act(async () => {
      vi.setSystemTime(LOCAL);
      document.dispatchEvent(new Event('visibilitychange'));
    });
    harness.emailVerificationState.mockResolvedValue(verificationState({
      codeExpiresAt: '2026-10-10T08:00:00.000Z',
    }));
    await act(async () => {
      click(container, 'retry');
      await Promise.resolve();
    });
    await act(async () => {
      click(container, 'code');
      click(container, 'verify');
      await Promise.resolve();
    });
    expect(harness.verifyEmailVerification).not.toHaveBeenCalled();
    expect(container.textContent).toContain('reason:otp-expired');

    harness.emailVerificationState.mockResolvedValue(verificationState());
    await act(async () => {
      click(container, 'retry');
      await Promise.resolve();
    });
    harness.requestEmailVerification.mockRejectedValueOnce(new ApiClientError('Email resend cooldown is active', {
      kind: 'rate_limited',
      status: 429,
      code: ApiErrorCode.MAIL_COOLDOWN,
      details: { retryAt: '2026-10-10T08:01:30.000Z' },
    }));
    await act(async () => {
      click(container, 'send');
      await Promise.resolve();
    });
    expect(container.textContent).toContain('reason:cooldown');
    expect(container.textContent).toContain('resend:90');
    expect(container.textContent).not.toContain('Email resend cooldown is active');
    const sends = harness.requestEmailVerification.mock.calls.length;
    await act(async () => {
      click(container, 'send');
    });
    expect(harness.requestEmailVerification).toHaveBeenCalledTimes(sends);

    harness.verifyEmailVerification.mockRejectedValueOnce(new ApiClientError('OTP retry pause is active', {
      kind: 'rate_limited',
      status: 429,
      code: ApiErrorCode.OTP_PAUSED,
      details: { pausedUntil: '2026-10-10T08:05:00.000Z' },
    }));
    await act(async () => {
      click(container, 'verify');
      await Promise.resolve();
    });
    expect(container.textContent).toContain('reason:paused');
    expect(container.textContent).toContain('pause:300');
    expect(harness.verifyEmailVerification).toHaveBeenCalledTimes(1);
    await act(async () => {
      click(container, 'verify');
    });
    expect(harness.verifyEmailVerification).toHaveBeenCalledTimes(1);
    const pausedKey = (harness.verifyEmailVerification.mock.calls[0]?.[0] as { idempotencyKey?: string }).idempotencyKey;
    const readsWhilePaused = harness.emailVerificationState.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(301_000);
    });
    expect(harness.emailVerificationState).toHaveBeenCalledTimes(readsWhilePaused);
    harness.verifyEmailVerification.mockRejectedValueOnce(networkError());
    await act(async () => {
      click(container, 'verify');
      await Promise.resolve();
    });
    expect(harness.verifyEmailVerification).toHaveBeenCalledTimes(2);
    const resumedKey = (harness.verifyEmailVerification.mock.calls[1]?.[0] as { idempotencyKey?: string }).idempotencyKey;
    expect(resumedKey).not.toBe(pausedKey);
  });

  it('replays one send key across an uncertain result and rotates it after acceptance', async () => {
    harness.emailVerificationState.mockResolvedValue(verificationState());
    const container = render();
    await flush();
    harness.requestEmailVerification.mockRejectedValueOnce(networkError());
    await act(async () => {
      click(container, 'send');
    });
    await flush();
    harness.requestEmailVerification.mockRejectedValueOnce(networkError());
    await act(async () => {
      click(container, 'send');
    });
    await flush();
    harness.requestEmailVerification.mockResolvedValueOnce({ ok: true, delivery: 'unknown' });
    await act(async () => {
      click(container, 'send');
    });
    await flush();
    const keys = harness.requestEmailVerification.mock.calls.map((call) => {
      const body = call[0] as { idempotencyKey?: string; turnstileToken?: string };
      return body;
    });
    expect(keys).toHaveLength(3);
    expect(keys[0]?.idempotencyKey).toBe(keys[1]?.idempotencyKey);
    expect(keys[1]?.idempotencyKey).toBe(keys[2]?.idempotencyKey);
    expect(keys[0]?.turnstileToken).toBe('proof-token');
    expect(container.textContent).toContain('reason:unknown');
    expect(container.textContent).not.toContain('synthetic-network');

    harness.requestEmailVerification.mockResolvedValueOnce({ ok: true, delivery: 'accepted' });
    await act(async () => {
      click(container, 'send');
    });
    await flush();
    const accepted = harness.requestEmailVerification.mock.calls[3]?.[0] as { idempotencyKey?: string };
    expect(accepted.idempotencyKey).toBe(keys[0]?.idempotencyKey);
    expect(container.textContent).toContain('reason:accepted');

    const replayKey = keys[0]?.idempotencyKey;
    harness.me.mockResolvedValue({
      user: account({ emailVerifiedAt: '2026-10-10T08:05:00.000Z' }),
    });
    harness.requestEmailVerification.mockResolvedValueOnce({ ok: true, delivery: 'already_verified' });
    await act(async () => {
      click(container, 'send');
    });
    await flush();
    expect(harness.verified).toBe(1);
    const finished = harness.requestEmailVerification.mock.calls[4]?.[0] as { idempotencyKey?: string };
    expect(finished.idempotencyKey).not.toBe(replayKey);
    expect(client?.getQueryData<User>(authKeys.session)?.emailVerifiedAt).toBe('2026-10-10T08:05:00.000Z');

    harness.verified = 0;
    harness.me.mockResolvedValue({
      user: account({ id: '11111111-1111-4111-8111-111111111111', emailVerifiedAt: '2026-10-10T08:05:00.000Z' }),
    });
    harness.requestEmailVerification.mockResolvedValueOnce({ ok: true, delivery: 'already_verified' });
    await act(async () => {
      click(container, 'send');
    });
    await flush();
    expect(harness.verified).toBe(0);
    expect(client?.getQueryData<User>(authKeys.session)?.id).toBe(OWNER_ID);
    expect(container.textContent).toContain('reason:session');
  });

  it('keeps a rejected code until the field changes and spends one verify key for that code', async () => {
    harness.emailVerificationState.mockResolvedValue(verificationState({
      sendStatus: 'accepted',
      codeExpiresAt: '2026-10-10T08:10:00.000Z',
    }));
    const container = render();
    await flush();
    await act(async () => {
      click(container, 'short');
      click(container, 'verify');
    });
    await flush();
    expect(harness.verifyEmailVerification).not.toHaveBeenCalled();
    expect(container.textContent).toContain('reason:validation');

    harness.verifyEmailVerification.mockRejectedValueOnce(networkError());
    await act(async () => {
      click(container, 'code');
      click(container, 'verify');
    });
    await flush();
    harness.verifyEmailVerification.mockRejectedValueOnce(new ApiClientError('OTP is invalid', {
      kind: 'forbidden',
      status: 403,
      code: ApiErrorCode.OTP_INVALID,
    }));
    await act(async () => {
      click(container, 'verify');
    });
    await flush();
    expect(container.textContent).toContain('entered:123456');
    expect(container.textContent).toContain('locked:yes');
    expect(container.textContent).toContain('reason:otp-invalid');
    expect(container.textContent).not.toContain('OTP is invalid');
    const verifyCalls = harness.verifyEmailVerification.mock.calls.length;
    await act(async () => {
      click(container, 'verify');
    });
    expect(harness.verifyEmailVerification).toHaveBeenCalledTimes(verifyCalls);
    const bodies = harness.verifyEmailVerification.mock.calls.map((call) => call[0] as { code: string; idempotencyKey: string });
    expect(bodies[0]?.code).toBe('123456');
    expect(bodies[0]?.idempotencyKey).toBe(bodies[1]?.idempotencyKey);

    harness.me.mockResolvedValue({
      user: account({ emailVerifiedAt: '2026-10-10T08:06:00.000Z' }),
    });
    harness.verifyEmailVerification.mockResolvedValueOnce({ ok: true });
    await act(async () => {
      click(container, 'edit');
      click(container, 'verify');
    });
    await flush();
    const edited = harness.verifyEmailVerification.mock.calls.at(-1)?.[0] as { code: string; idempotencyKey: string };
    expect(edited.code).toBe('654321');
    expect(edited.idempotencyKey).not.toBe(bodies[0]?.idempotencyKey);
    expect(harness.verified).toBe(1);
    expect(client?.getQueryData<User>(authKeys.session)?.id).toBe(OWNER_ID);
    expect(client?.getQueryData<User>(authKeys.session)?.emailVerifiedAt).toBe('2026-10-10T08:06:00.000Z');
    const meOptions = harness.me.mock.calls.at(-1)?.[0] as { signal?: AbortSignal } | undefined;
    expect(meOptions?.signal).toBeInstanceOf(AbortSignal);
    expect(meOptions?.signal?.aborted).toBe(false);
  });

  it('corrects the owned address without sending mail and drops a retired state reply', async () => {
    harness.emailVerificationState.mockResolvedValue(verificationState());
    const container = render();
    await flush();
    await act(async () => {
      click(container, 'code');
      click(container, 'bad-email');
      click(container, 'correct');
    });
    await flush();
    expect(harness.changeUnverifiedEmail).not.toHaveBeenCalled();
    expect(container.textContent).toContain('reason:validation');

    harness.changeUnverifiedEmail.mockResolvedValueOnce({
      user: account({ id: '11111111-1111-4111-8111-111111111111', email: 'other@example.com' }),
    });
    await act(async () => {
      click(container, 'next-email');
      click(container, 'correct');
    });
    await flush();
    expect(client?.getQueryData<User>(authKeys.session)?.email).toBe('author@example.com');
    expect(container.textContent).toContain('reason:session');

    harness.changeUnverifiedEmail.mockRejectedValueOnce(new ApiClientError('Disposable email domains cannot be used', {
      kind: 'bad_request',
      status: 400,
      code: ApiErrorCode.DISPOSABLE_EMAIL,
    }));
    await act(async () => {
      click(container, 'disposable-email');
      click(container, 'correct');
    });
    await flush();
    expect(container.textContent).toContain('reason:disposable');
    expect(container.textContent).not.toContain('Disposable email domains cannot be used');
    expect(client?.getQueryData<User>(authKeys.session)?.email).toBe('author@example.com');
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();

    const pending: Array<(state: EmailVerificationState) => void> = [];
    harness.emailVerificationState.mockImplementation(
      () => new Promise((resolve) => pending.push(resolve)),
    );
    harness.changeUnverifiedEmail.mockResolvedValueOnce({
      user: account({ email: 'next@example.com' }),
    });
    await act(async () => {
      click(container, 'next-email');
      click(container, 'correct');
    });
    await flush();
    const fresh = pending.at(-1);
    expect(fresh).toBeDefined();
    await act(async () => {
      fresh?.(verificationState({
        email: 'next@example.com',
        sendStatus: 'none',
        resendAvailableAt: '2099-01-01T00:00:00.000Z',
      }));
    });
    await flush();
    expect(container.textContent).toContain('send:none');
    expect(container.textContent).not.toContain('entered:123456');
    expect(container.textContent).toContain('reason:code-invalidated');
    expect(container.textContent).toMatch(/resend:[1-9]/);
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    expect(client?.getQueryData<User>(authKeys.session)).toMatchObject({
      id: OWNER_ID,
      email: 'next@example.com',
      slug: 'author',
      acceptedRulesVersion: 'MVP_RULES_V1',
    });

    harness.emailVerificationState.mockResolvedValue(verificationState({
      email: 'next@example.com',
      sendStatus: 'accepted',
    }));
    const reads = harness.emailVerificationState.mock.calls.length;
    replaceUser(account({ email: 'next@example.com' }));
    await flush();
    expect(container.textContent).toContain('send:none');
    expect(container.textContent).toMatch(/resend:[1-9]/);
    expect(container.textContent).toContain('reason:code-invalidated');
    expect(harness.emailVerificationState).toHaveBeenCalledTimes(reads);

    await act(async () => {
      click(container, 'blur');
    });
    await act(async () => {
      fresh?.(verificationState({ email: 'next@example.com', sendStatus: 'accepted', verified: true }));
    });
    await flush();
    expect(harness.verified).toBe(0);
    expect(container.textContent).toContain('send:nostate');
    expect(container.textContent).toContain('reason:none');
  });

  it.each([
    { failure: 'network', error: networkError() },
    { failure: 'server', error: new ApiClientError('synthetic-server', { kind: 'server', status: 503, code: null }) },
  ])('retries only state reading after an owned correction and a $failure failure', async ({ error }) => {
    harness.emailVerificationState.mockResolvedValueOnce(verificationState({
      sendStatus: 'accepted',
      codeExpiresAt: '2099-01-01T00:00:00.000Z',
    }));
    const container = render();
    await flush();
    let rejectRead: (failure: unknown) => void = () => {};
    harness.emailVerificationState.mockImplementationOnce(
      () => new Promise((_resolve, reject) => {
        rejectRead = reject;
      }),
    );
    harness.changeUnverifiedEmail.mockResolvedValueOnce({ user: account({ email: 'next@example.com' }) });
    await act(async () => {
      click(container, 'code');
      click(container, 'next-email');
      click(container, 'correct');
    });
    await flush();
    expect(client?.getQueryData<User>(authKeys.session)?.email).toBe('next@example.com');
    replaceUser(account({ email: 'next@example.com' }));
    await flush();
    await act(async () => {
      rejectRead(error);
    });
    await flush();
    expect(container.textContent).toContain('status:error');
    expect(container.textContent).toContain('reason:read-error');
    expect(container.textContent).toContain('send:nostate');
    expect(container.textContent).toContain('codeLeft:0');
    expect(container.textContent).not.toContain('entered:123456');
    expect(container.textContent).toContain('busy:no');
    expect(client?.getQueryData<User>(authKeys.session)).toMatchObject({
      id: OWNER_ID,
      email: 'next@example.com',
      slug: 'author',
      acceptedRulesVersion: 'MVP_RULES_V1',
    });
    await act(async () => {
      click(container, 'send');
      click(container, 'verify');
    });
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    expect(harness.verifyEmailVerification).not.toHaveBeenCalled();

    harness.emailVerificationState.mockResolvedValue(verificationState({ email: 'next@example.com' }));
    await act(async () => {
      click(container, 'retry');
    });
    await flush();
    expect(container.textContent).toContain('status:ready');
    expect(harness.emailVerificationState).toHaveBeenCalledTimes(3);
    expect(container.textContent).toContain('reason:none');
    expect(harness.changeUnverifiedEmail).toHaveBeenCalledTimes(1);
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    harness.requestEmailVerification.mockResolvedValueOnce({ ok: true, delivery: 'accepted' });
    await act(async () => {
      click(container, 'send');
    });
    await flush();
    expect(harness.requestEmailVerification).toHaveBeenCalledTimes(1);
    expect(harness.verified).toBe(0);
  });

  it('ignores a failed correction state read after a different owner becomes active', async () => {
    harness.emailVerificationState.mockResolvedValueOnce(verificationState());
    const container = render();
    await flush();
    let rejectRead: (failure: unknown) => void = () => {};
    harness.emailVerificationState.mockImplementationOnce(
      () => new Promise((_resolve, reject) => {
        rejectRead = reject;
      }),
    );
    harness.changeUnverifiedEmail.mockResolvedValueOnce({ user: account({ email: 'next@example.com' }) });
    await act(async () => {
      click(container, 'next-email');
      click(container, 'correct');
    });
    await flush();
    const readOptions = harness.emailVerificationState.mock.calls.at(-1)?.[0] as { signal?: AbortSignal };
    replaceUser(account({ email: 'next@example.com' }));
    await flush();
    const otherId = '11111111-1111-4111-8111-111111111111';
    harness.emailVerificationState.mockResolvedValue(verificationState({
      email: 'other@example.com',
      sendStatus: 'rejected',
    }));
    replaceUser(account({ id: otherId, email: 'other@example.com' }));
    await flush();
    expect(readOptions.signal?.aborted).toBe(true);
    await act(async () => {
      rejectRead(networkError());
    });
    await flush();
    expect(container.textContent).toContain('status:ready');
    expect(container.textContent).toContain('send:rejected');
    expect(container.textContent).not.toContain('reason:read-error');
    expect(client?.getQueryData<User>(authKeys.session)).toMatchObject({ id: otherId, email: 'other@example.com' });
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    expect(harness.verified).toBe(0);
  });

  it('replays a retained unknown send during cooldown and quota, then rotates an explicit send after the deadline', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(LOCAL);
    harness.emailVerificationState.mockResolvedValue(verificationState({
      codeExpiresAt: '2026-10-10T08:10:00.000Z',
    }));
    const container = render();
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.textContent).toContain('retrySend:no');

    harness.requestEmailVerification.mockRejectedValueOnce(networkError());
    await act(async () => {
      click(container, 'send');
      await Promise.resolve();
    });
    const retainedKey = (harness.requestEmailVerification.mock.calls[0]?.[0] as { idempotencyKey?: string }).idempotencyKey;
    expect(container.textContent).toContain('reason:network');
    expect(container.textContent).toContain('retrySend:yes');
    expect(container.textContent).not.toContain('synthetic-network');

    harness.verifyEmailVerification.mockRejectedValueOnce(networkError());
    await act(async () => {
      click(container, 'code');
      click(container, 'verify');
      await Promise.resolve();
    });
    expect(container.textContent).toContain('retrySend:yes');
    expect(harness.requestEmailVerification).toHaveBeenCalledTimes(1);

    const cooled = verificationState({
      sendStatus: 'unknown',
      codeExpiresAt: '2026-10-10T08:10:00.000Z',
      resendAvailableAt: '2026-10-10T08:01:00.000Z',
      quotaResetsAt: '2026-10-10T08:01:00.000Z',
    });
    harness.requestEmailVerification.mockResolvedValue({ ok: true, delivery: 'unknown' });
    harness.emailVerificationState.mockResolvedValue(cooled);
    await act(async () => {
      click(container, 'send');
      await Promise.resolve();
    });
    expect(harness.requestEmailVerification).toHaveBeenCalledTimes(2);
    expect((harness.requestEmailVerification.mock.calls[1]?.[0] as { idempotencyKey?: string }).idempotencyKey).toBe(retainedKey);
    expect(container.textContent).toContain('reason:unknown');
    expect(container.textContent).toContain('retrySend:yes');
    expect(container.textContent).toContain('resend:60');
    expect(container.textContent).toContain('quota:60');

    await act(async () => {
      click(container, 'send');
      await Promise.resolve();
    });
    expect(harness.requestEmailVerification).toHaveBeenCalledTimes(3);
    const replay = harness.requestEmailVerification.mock.calls[2]?.[0] as { idempotencyKey?: string; turnstileToken?: string };
    expect(replay.idempotencyKey).toBe(retainedKey);
    expect(replay.turnstileToken).toBe('proof-token');
    await act(async () => {
      click(container, 'send-new');
    });
    expect(harness.requestEmailVerification).toHaveBeenCalledTimes(3);
    await act(async () => {
      click(container, 'send');
      await Promise.resolve();
    });
    expect(harness.requestEmailVerification).toHaveBeenCalledTimes(4);
    expect((harness.requestEmailVerification.mock.calls[3]?.[0] as { idempotencyKey?: string }).idempotencyKey).toBe(retainedKey);

    const reads = harness.emailVerificationState.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(harness.emailVerificationState).toHaveBeenCalledTimes(reads);
    harness.requestEmailVerification.mockResolvedValueOnce({ ok: true, delivery: 'accepted' });
    await act(async () => {
      click(container, 'send-new');
      await Promise.resolve();
    });
    const freshKey = (harness.requestEmailVerification.mock.calls[4]?.[0] as { idempotencyKey?: string }).idempotencyKey;
    expect(freshKey).not.toBe(retainedKey);
    expect(container.textContent).toContain('reason:accepted');
    expect(container.textContent).toContain('retrySend:no');
  });

  it('treats a cheap rate limit as a refusal and does not keep that send key', async () => {
    harness.emailVerificationState.mockResolvedValue(verificationState());
    const container = render();
    await flush();
    harness.requestEmailVerification.mockRejectedValueOnce(new ApiClientError('too many requests', {
      kind: 'rate_limited',
      status: 429,
      code: ApiErrorCode.RATE_LIMITED,
    }));
    await act(async () => {
      click(container, 'send');
    });
    await flush();
    expect(container.textContent).toContain('reason:rate-limit');
    expect(container.textContent).toContain('retrySend:no');
    expect(container.textContent).not.toContain('too many requests');
    const refusedKey = (harness.requestEmailVerification.mock.calls[0]?.[0] as { idempotencyKey?: string }).idempotencyKey;
    harness.requestEmailVerification.mockRejectedValueOnce(new ApiClientError('limited', {
      kind: 'rate_limited',
      status: 429,
      code: null,
    }));
    await act(async () => {
      click(container, 'send');
    });
    await flush();
    const rotatedKey = (harness.requestEmailVerification.mock.calls[1]?.[0] as { idempotencyKey?: string }).idempotencyKey;
    expect(rotatedKey).not.toBe(refusedKey);
    expect(container.textContent).toContain('reason:rate-limit');
    expect(container.textContent).toContain('retrySend:no');
  });

  it('keeps the original uncertain send when a replay is refused by a cheap rate limit', async () => {
    harness.emailVerificationState.mockResolvedValue(verificationState());
    const container = render();
    await flush();
    harness.requestEmailVerification.mockRejectedValueOnce(networkError());
    await act(async () => {
      click(container, 'send');
    });
    await flush();
    const retainedKey = (harness.requestEmailVerification.mock.calls[0]?.[0] as { idempotencyKey?: string }).idempotencyKey;
    expect(container.textContent).toContain('reason:network');
    expect(container.textContent).toContain('retrySend:yes');

    harness.requestEmailVerification.mockRejectedValueOnce(new ApiClientError('too many requests', {
      kind: 'rate_limited',
      status: 429,
      code: ApiErrorCode.RATE_LIMITED,
    }));
    await act(async () => {
      click(container, 'send');
    });
    await flush();
    const refusedKey = (harness.requestEmailVerification.mock.calls[1]?.[0] as { idempotencyKey?: string }).idempotencyKey;
    expect(refusedKey).toBe(retainedKey);
    expect(container.textContent).toContain('reason:rate-limit');
    expect(container.textContent).toContain('retrySend:yes');
    expect(container.textContent).not.toContain('too many requests');

    harness.requestEmailVerification.mockResolvedValueOnce({ ok: true, delivery: 'accepted' });
    await act(async () => {
      click(container, 'send');
    });
    await flush();
    const acceptedKey = (harness.requestEmailVerification.mock.calls[2]?.[0] as { idempotencyKey?: string }).idempotencyKey;
    expect(acceptedKey).toBe(retainedKey);
    expect(harness.requestEmailVerification).toHaveBeenCalledTimes(3);
    expect(container.textContent).toContain('reason:accepted');
    expect(container.textContent).toContain('retrySend:no');
  });

  it('aborts a pending verify when the code changes and a pending correction when the draft changes', async () => {
    harness.emailVerificationState.mockResolvedValue(verificationState({
      sendStatus: 'accepted',
      codeExpiresAt: '2099-01-01T00:00:00.000Z',
    }));
    const container = render();
    await flush();
    let releaseFirst: (value: { ok: true }) => void = () => {};
    let releaseSecond: (value: { ok: true }) => void = () => {};
    let verifyCalls = 0;
    harness.verifyEmailVerification.mockImplementation(
      () => new Promise((resolve) => {
        verifyCalls += 1;
        if (verifyCalls === 1) releaseFirst = resolve;
        else releaseSecond = resolve;
      }),
    );
    await act(async () => {
      click(container, 'code');
      click(container, 'verify');
    });
    await flush();
    expect(container.textContent).toContain('busy:yes');
    await act(async () => {
      click(container, 'edit');
      click(container, 'verify');
    });
    expect(container.textContent).toContain('busy:yes');
    expect(container.textContent).toContain('entered:654321');
    harness.me.mockResolvedValue({
      user: account({ emailVerifiedAt: '2026-10-10T08:06:00.000Z' }),
    });
    await act(async () => {
      releaseFirst({ ok: true });
    });
    await flush();
    expect(harness.verified).toBe(0);
    expect(harness.me).not.toHaveBeenCalled();
    expect(container.textContent).toContain('busy:yes');
    await act(async () => {
      click(container, 'code');
    });
    expect(container.textContent).toContain('busy:no');
    await act(async () => {
      releaseSecond({ ok: true });
    });
    await flush();
    expect(harness.verified).toBe(0);
    expect(harness.me).not.toHaveBeenCalled();

    let releaseMe: (value: { user: User }) => void = () => {};
    let meSignal: AbortSignal | undefined;
    harness.verifyEmailVerification.mockResolvedValue({ ok: true });
    harness.me.mockImplementation((...args: unknown[]) => {
      meSignal = (args[0] as { signal?: AbortSignal } | undefined)?.signal;
      return new Promise((resolve) => {
        releaseMe = resolve;
      });
    });
    await act(async () => {
      click(container, 'verify');
    });
    await flush();
    expect(meSignal).toBeInstanceOf(AbortSignal);
    expect(container.textContent).toContain('busy:yes');
    await act(async () => {
      click(container, 'edit');
    });
    expect(meSignal?.aborted).toBe(true);
    expect(container.textContent).toContain('busy:no');
    await act(async () => {
      releaseMe({ user: account({ emailVerifiedAt: '2026-10-10T08:06:00.000Z' }) });
    });
    await flush();
    expect(harness.verified).toBe(0);

    let releaseCorrect: (value: { user: User }) => void = () => {};
    harness.changeUnverifiedEmail.mockImplementation(
      () => new Promise((resolve) => {
        releaseCorrect = resolve;
      }),
    );
    await act(async () => {
      click(container, 'next-email');
      click(container, 'correct');
    });
    await flush();
    expect(container.textContent).toContain('busy:yes');
    await act(async () => {
      click(container, 'disposable-email');
    });
    expect(container.textContent).toContain('busy:no');
    await act(async () => {
      releaseCorrect({ user: account({ email: 'next@example.com' }) });
    });
    await flush();
    expect(client?.getQueryData<User>(authKeys.session)?.email).toBe('author@example.com');
    expect(harness.verified).toBe(0);
    expect(container.textContent).toContain('busy:no');
  });

  it('clears owner state on account, epoch, and blur changes and ignores the retired reply', async () => {
    const pending: Array<(state: EmailVerificationState) => void> = [];
    harness.emailVerificationState.mockImplementation(
      () => new Promise((resolve) => pending.push(resolve)),
    );
    const container = render();
    await act(async () => {
      pending[0]?.(verificationState({ sendStatus: 'accepted' }));
    });
    await flush();
    await act(async () => {
      click(container, 'code');
      click(container, 'send-empty');
    });
    expect(container.textContent).toContain('entered:123456');
    expect(container.textContent).toContain('reason:challenge');
    expect(container.textContent).toContain('send:accepted');

    const otherId = '11111111-1111-4111-8111-111111111111';
    await act(async () => {
      click(container, 'retry');
    });
    const retired = pending.at(-1);
    replaceUser(account({ id: otherId, email: 'other@example.com' }));
    await act(async () => {
      retired?.(verificationState({ sendStatus: 'accepted', email: 'author@example.com' }));
    });
    await flush();
    expect(container.textContent).not.toContain('entered:123456');
    expect(container.textContent).not.toContain('reason:challenge');
    expect(container.textContent).not.toContain('send:accepted');
    const otherState = pending.at(-1);
    await act(async () => {
      otherState?.(verificationState({ email: 'other@example.com', sendStatus: 'none' }));
    });
    await flush();
    expect(container.textContent).toContain('send:none');
    expect(container.textContent).toContain('reason:none');
    expect(client?.getQueryData<User>(authKeys.session)?.id).toBe(otherId);

    await act(async () => {
      click(container, 'code');
    });
    expect(container.textContent).toContain('entered:123456');
    const beforeEpoch = harness.emailVerificationState.mock.calls.length;
    await act(async () => {
      if (!client) throw new Error('missing client');
      advanceAuthEpoch(client);
    });
    await flush();
    expect(container.textContent).not.toContain('entered:123456');
    expect(container.textContent).toContain('reason:none');
    expect(harness.emailVerificationState.mock.calls.length).toBeGreaterThan(beforeEpoch);
    const epochState = pending.at(-1);
    await act(async () => {
      epochState?.(verificationState({ email: 'other@example.com', sendStatus: 'rejected' }));
    });
    await flush();
    expect(container.textContent).toContain('send:rejected');

    await act(async () => {
      click(container, 'retry');
    });
    const late = pending.at(-1);
    await act(async () => {
      click(container, 'blur');
    });
    expect(container.textContent).toContain('send:nostate');
    expect(container.textContent).toContain('reason:none');
    expect(container.textContent).not.toContain('entered:123456');
    await act(async () => {
      late?.(verificationState({ email: 'other@example.com', sendStatus: 'accepted', verified: true }));
    });
    await flush();
    expect(harness.verified).toBe(0);
    expect(container.textContent).toContain('send:nostate');
  });

  it('reports a failed conflict refresh and ignores a correction error after the owner changes', async () => {
    harness.emailVerificationState.mockResolvedValue(verificationState({
      sendStatus: 'accepted',
      codeExpiresAt: '2099-01-01T00:00:00.000Z',
    }));
    const container = render();
    await flush();
    harness.verifyEmailVerification.mockRejectedValueOnce({ name: 'AbortError' });
    await act(async () => {
      click(container, 'code');
      click(container, 'verify');
    });
    await flush();
    expect(container.textContent).toContain('reason:none');
    expect(container.textContent).not.toContain('reason:network');

    harness.changeUnverifiedEmail.mockRejectedValueOnce(new ApiClientError('address is taken', {
      kind: 'conflict',
      status: 409,
      code: ApiErrorCode.CONFLICT,
    }));
    harness.emailVerificationState.mockRejectedValueOnce(networkError());
    await act(async () => {
      click(container, 'next-email');
      click(container, 'correct');
    });
    await flush();
    expect(container.textContent).toContain('reason:read-error');
    expect(container.textContent).toContain('status:error');
    expect(container.textContent).not.toContain('reason:taken');
    expect(container.textContent).not.toContain('address is taken');
    expect(container.textContent).not.toContain('synthetic-network');

    harness.emailVerificationState.mockResolvedValue(verificationState());
    await act(async () => {
      click(container, 'retry');
    });
    await flush();
    let rejectCorrect: (error: unknown) => void = () => {};
    harness.changeUnverifiedEmail.mockImplementation(
      () => new Promise((_resolve, reject) => {
        rejectCorrect = reject;
      }),
    );
    await act(async () => {
      click(container, 'code');
      click(container, 'next-email');
      click(container, 'correct');
    });
    await flush();
    const otherId = '11111111-1111-4111-8111-111111111111';
    harness.emailVerificationState.mockResolvedValue(verificationState({
      email: 'other@example.com',
      sendStatus: 'none',
    }));
    replaceUser(account({ id: otherId, email: 'other@example.com' }));
    await act(async () => {
      rejectCorrect({ name: 'AbortError' });
    });
    await flush();
    expect(container.textContent).not.toContain('entered:123456');
    expect(container.textContent).not.toContain('reason:taken');
    expect(container.textContent).not.toContain('reason:network');
    expect(harness.verified).toBe(0);

    harness.emailVerificationState.mockResolvedValue(verificationState());
    replaceUser(account());
    await flush();
    harness.changeUnverifiedEmail.mockRejectedValueOnce(new ApiClientError('address is taken', {
      kind: 'conflict',
      status: 409,
      code: ApiErrorCode.CONFLICT,
    }));
    harness.emailVerificationState.mockResolvedValueOnce(verificationState({ verified: true }));
    harness.me.mockResolvedValue({
      user: account({ emailVerifiedAt: '2026-10-10T08:07:00.000Z' }),
    });
    await act(async () => {
      click(container, 'next-email');
      click(container, 'correct');
    });
    await flush();
    expect(harness.verified).toBe(1);
    const meOptions = harness.me.mock.calls.at(-1)?.[0] as { signal?: AbortSignal } | undefined;
    expect(meOptions?.signal).toBeInstanceOf(AbortSignal);
  });
});
