/**
 * @vitest-environment jsdom
 */
import { act, createElement, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '@bidplace/api-client';
import { ApiErrorCode, type EmailVerificationState, type User } from '@bidplace/contracts';

import { flush } from '../../testing/dom';
import { AUTH_RATE_LIMIT_COPY, AUTH_TURNSTILE_REQUIRED_COPY, AUTH_TURNSTILE_UNAVAILABLE_COPY } from '../../errors';
import { authKeys } from '../../lib/query-cache';
import { VerifyEmailForm } from './verify-email-form';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const OWNER_ID = '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1';

const harness = vi.hoisted(() => ({
  user: null as User | null,
  focused: true,
  pathname: '/verify-email',
  siteKey: null as string | null,
  proof: null as string | null,
  replace: vi.fn(),
  emailVerificationState: vi.fn<(...args: unknown[]) => Promise<EmailVerificationState>>(),
  requestEmailVerification: vi.fn<(...args: unknown[]) => Promise<{ ok: true; delivery: string }>>(),
  verifyEmailVerification: vi.fn<(...args: unknown[]) => Promise<{ ok: true }>>(),
  changeUnverifiedEmail: vi.fn<(...args: unknown[]) => Promise<{ user: User }>>(),
  me: vi.fn<(...args: unknown[]) => Promise<{ user: User }>>(),
  redraw: () => undefined as void,
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Text: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  TextInput: ({
    accessibilityLabel,
    value,
    onChangeText,
  }: {
    accessibilityLabel?: string;
    value?: string;
    onChangeText?: (value: string) => void;
  }) => createElement('input', {
    'aria-label': accessibilityLabel,
    value: value ?? '',
    onChange: (event: { target: { value: string } }) => onChangeText?.(event.target.value),
  }),
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({ replace: harness.replace }),
  useIsFocused: () => harness.focused,
  usePathname: () => harness.pathname,
}));

vi.mock('../../lib/environment', () => ({
  getTurnstileSiteKey: () => harness.siteKey,
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

vi.mock('../../components/ui', () => ({
  AppText: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  PrimaryButton: ({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
  }) => createElement('button', {
    type: 'button',
    disabled: Boolean(disabled),
    onClick: () => {
      if (!disabled) onPress?.();
    },
  }, label),
  SecondaryButton: ({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
  }) => createElement('button', {
    type: 'button',
    disabled: Boolean(disabled),
    onClick: () => {
      if (!disabled) onPress?.();
    },
  }, label),
  TextButton: ({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
  }) => createElement('button', {
    type: 'button',
    disabled: Boolean(disabled),
    onClick: () => {
      if (!disabled) onPress?.();
    },
  }, label),
  TextField: ({
    label,
    value,
    onChangeText,
    error,
  }: {
    label: string;
    value?: string;
    onChangeText?: (value: string) => void;
    error?: string;
  }) => createElement(
    'label',
    null,
    label,
    createElement('input', {
      'aria-label': label,
      value: value ?? '',
      onChange: (event: { target: { value: string } }) => onChangeText?.(event.target.value),
    }),
    error ? createElement('span', null, error) : null,
  ),
}));

vi.mock('./turnstile-widget', () => ({
  TurnstileWidget: ({
    action,
    onToken,
    onAvailability,
  }: {
    action: string;
    onToken: (token: string | null) => void;
    onAvailability: (availability: 'ready' | 'unavailable') => void;
  }) => {
    useLayoutEffect(() => {
      onAvailability('ready');
      if (harness.proof) onToken(harness.proof);
    }, [action, onAvailability, onToken]);
    return createElement('div', { 'data-turnstile': action });
  },
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

function Host() {
  const [, setTick] = useState(0);
  useEffect(() => {
    harness.redraw = () => setTick((value) => value + 1);
  }, []);
  return createElement(VerifyEmailForm, { redirectTo: '/profile' });
}

function mount() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(authKeys.session, harness.user);
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(createElement(QueryClientProvider, { client: queryClient }, createElement(Host)));
  });
  return { container, client: queryClient, unmount: () => { act(() => root.unmount()); container.remove(); } };
}

function click(container: ParentNode, label: string) {
  const button = [...container.querySelectorAll('button')].find((item) => item.textContent === label);
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing ${label}`);
  act(() => {
    button.click();
  });
}

function fill(container: ParentNode, label: string, value: string) {
  const node = container.querySelector(`[aria-label="${label}"]`);
  if (!(node instanceof HTMLInputElement)) throw new Error(`Missing ${label}`);
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  act(() => {
    setter?.call(node, value);
    node.dispatchEvent(new Event('input', { bubbles: true }));
    node.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

afterEach(() => {
  document.body.replaceChildren();
  harness.user = null;
  harness.focused = true;
  harness.pathname = '/verify-email';
  harness.siteKey = null;
  harness.proof = null;
  harness.replace.mockReset();
  vi.useRealTimers();
  harness.emailVerificationState.mockReset();
  harness.requestEmailVerification.mockReset();
  harness.verifyEmailVerification.mockReset();
  harness.changeUnverifiedEmail.mockReset();
  harness.me.mockReset();
});

describe('verify email form', () => {
  it('reads the server state and does not send mail on mount', async () => {
    harness.user = account();
    harness.emailVerificationState.mockResolvedValue(verificationState());
    const view = mount();
    await flush();
    expect(view.container.textContent).toContain('Код ещё не отправлен.');
    expect(view.container.textContent).not.toContain('Код отправлен');
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    expect(harness.emailVerificationState).toHaveBeenCalled();
    view.unmount();
  });

  it('shows an unavailable challenge without a site key and does not send', async () => {
    harness.user = account();
    harness.emailVerificationState.mockResolvedValue(verificationState());
    const view = mount();
    await flush();
    expect(view.container.textContent).toContain(AUTH_TURNSTILE_UNAVAILABLE_COPY);
    const button = [...view.container.querySelectorAll('button')].find((item) => item.textContent === 'Отправить код');
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    click(view.container, 'Отправить код');
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    view.unmount();
  });

  it('requires a fresh proof before the first send and does not claim delivery', async () => {
    harness.user = account();
    harness.siteKey = 'site-key';
    harness.proof = null;
    harness.emailVerificationState.mockResolvedValue(verificationState());
    const view = mount();
    await flush();
    expect(view.container.querySelector('[data-turnstile="email_verification"]')).not.toBeNull();
    click(view.container, 'Отправить код');
    await flush();
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    expect(view.container.textContent).toContain(AUTH_TURNSTILE_REQUIRED_COPY);
    view.unmount();

    harness.proof = 'widget-token';
    harness.emailVerificationState
      .mockResolvedValueOnce(verificationState())
      .mockResolvedValueOnce(verificationState({ sendStatus: 'accepted' }));
    harness.requestEmailVerification.mockResolvedValue({ ok: true, delivery: 'accepted' });
    const sent = mount();
    await flush();
    click(sent.container, 'Отправить код');
    await flush();
    expect(harness.requestEmailVerification).toHaveBeenCalledTimes(1);
    expect(harness.requestEmailVerification.mock.calls[0]?.[0]).toMatchObject({
      turnstileToken: 'widget-token',
    });
    expect(sent.container.textContent).toContain('Почтовый сервер принял письмо с кодом');
    expect(sent.container.textContent).toContain('Доставка в почтовый ящик не подтверждена');
    expect(sent.container.textContent).not.toContain('попытаемся');
    expect(sent.container.textContent).not.toContain('Код отправлен');
    expect(sent.container.textContent).not.toContain('Письмо отправлено');
    sent.unmount();
  });

  it('keeps a server resend wait instead of a local 60 second timer', async () => {
    harness.user = account();
    harness.siteKey = 'site-key';
    harness.emailVerificationState.mockResolvedValue(verificationState({
      sendStatus: 'accepted',
      resendAvailableAt: '2026-10-10T08:02:00.000Z',
    }));
    const view = mount();
    await flush();
    const label = [...view.container.querySelectorAll('button')].map((button) => button.textContent).join(' ');
    expect(label).toMatch(/Новый код через 1[12]\d сек/);
    expect(label).not.toContain('через 60 сек');
    const button = [...view.container.querySelectorAll('button')].find((item) => item.textContent?.startsWith('Новый код через'));
    expect((button as HTMLButtonElement).disabled).toBe(true);
    click(view.container, button?.textContent ?? '');
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    view.unmount();
  });

  it('retries the retained send after a network failure and during cooldown, then mints a code only after the deadline', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse('2026-10-10T08:00:30.000Z'));
    harness.user = account();
    harness.siteKey = 'site-key';
    harness.proof = 'widget-token';
    harness.emailVerificationState.mockResolvedValue(verificationState());
    const view = mount();
    await act(async () => {
      await Promise.resolve();
    });
    harness.requestEmailVerification.mockRejectedValueOnce(new ApiClientError('synthetic-network', {
      kind: 'network',
      status: 0,
    }));
    click(view.container, 'Отправить код');
    await act(async () => {
      await Promise.resolve();
    });
    const retainedKey = (harness.requestEmailVerification.mock.calls[0]?.[0] as { idempotencyKey?: string }).idempotencyKey;
    expect(view.container.textContent).toContain('Повторить тот же запрос');
    expect(view.container.textContent).toContain('Исход отправки');
    expect(view.container.textContent).toContain('не отправит ещё одно письмо');
    expect([...view.container.querySelectorAll('button')].some((button) => button.textContent === 'Отправить новый код')).toBe(true);
    harness.emailVerificationState.mockResolvedValue(verificationState({
      sendStatus: 'unknown',
      resendAvailableAt: '2026-10-10T08:01:00.000Z',
      quotaResetsAt: '2026-10-10T08:01:00.000Z',
    }));
    harness.requestEmailVerification.mockResolvedValue({ ok: true, delivery: 'unknown' });
    click(view.container, 'Повторить тот же запрос');
    await act(async () => {
      await Promise.resolve();
    });
    expect(harness.requestEmailVerification).toHaveBeenCalledTimes(2);
    expect((harness.requestEmailVerification.mock.calls[1]?.[0] as { idempotencyKey?: string }).idempotencyKey).toBe(retainedKey);
    expect(view.container.textContent).toMatch(/Новый код через 60 сек/);
    const explicit = [...view.container.querySelectorAll('button')].find((button) => button.textContent === 'Новый код через 60 сек');
    expect((explicit as HTMLButtonElement).disabled).toBe(true);
    click(view.container, 'Новый код через 60 сек');
    expect(harness.requestEmailVerification).toHaveBeenCalledTimes(2);
    const retry = [...view.container.querySelectorAll('button')].find((button) => button.textContent === 'Повторить тот же запрос');
    expect((retry as HTMLButtonElement).disabled).toBe(false);
    click(view.container, 'Повторить тот же запрос');
    await act(async () => {
      await Promise.resolve();
    });
    expect(harness.requestEmailVerification).toHaveBeenCalledTimes(3);
    expect((harness.requestEmailVerification.mock.calls[2]?.[0] as { idempotencyKey?: string }).idempotencyKey).toBe(retainedKey);
    const reads = harness.emailVerificationState.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(harness.emailVerificationState).toHaveBeenCalledTimes(reads);
    harness.emailVerificationState.mockResolvedValue(verificationState({ sendStatus: 'accepted' }));
    harness.requestEmailVerification.mockResolvedValueOnce({ ok: true, delivery: 'accepted' });
    click(view.container, 'Отправить новый код');
    await act(async () => {
      await Promise.resolve();
    });
    const freshKey = (harness.requestEmailVerification.mock.calls[3]?.[0] as { idempotencyKey?: string }).idempotencyKey;
    expect(freshKey).not.toBe(retainedKey);
    expect(view.container.textContent).toContain('Почтовый сервер принял письмо с кодом');
    expect([...view.container.querySelectorAll('button')].some((button) => button.textContent === 'Повторить тот же запрос')).toBe(false);
    view.unmount();
  });

  it('shows a cheap rate limit without a same-request retry or an address conflict', async () => {
    harness.user = account();
    harness.siteKey = 'site-key';
    harness.proof = 'widget-token';
    harness.emailVerificationState.mockResolvedValue(verificationState());
    const view = mount();
    await flush();
    harness.requestEmailVerification.mockRejectedValueOnce(new ApiClientError('too many requests', {
      kind: 'rate_limited',
      status: 429,
      code: ApiErrorCode.RATE_LIMITED,
    }));
    click(view.container, 'Отправить код');
    await flush();
    expect(view.container.textContent).toContain(AUTH_RATE_LIMIT_COPY);
    expect(view.container.textContent).not.toContain('уже занят');
    expect(view.container.textContent).not.toContain('приостановлена');
    expect(view.container.textContent).not.toContain('Новый код можно запросить');
    expect([...view.container.querySelectorAll('button')].some((button) => button.textContent === 'Повторить тот же запрос')).toBe(false);
    view.unmount();
  });

  it('retries a failed read without sending mail', async () => {
    harness.user = account();
    harness.emailVerificationState.mockRejectedValueOnce(new ApiClientError('offline', { kind: 'network', status: 0 }));
    const view = mount();
    await flush();
    expect(view.container.textContent).toContain('Не удалось прочитать статус подтверждения.');
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    harness.emailVerificationState.mockResolvedValue(verificationState());
    click(view.container, 'Повторить чтение');
    await flush();
    expect(view.container.textContent).toContain('Код ещё не отправлен.');
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    expect(harness.emailVerificationState).toHaveBeenCalledTimes(2);
    view.unmount();
  });

  it('shows state-read retry after saving an address and clears the read error when retry succeeds', async () => {
    harness.user = account();
    harness.emailVerificationState.mockResolvedValueOnce(verificationState());
    const view = mount();
    await flush();
    let rejectRead: (failure: unknown) => void = () => {};
    harness.emailVerificationState.mockImplementationOnce(
      () => new Promise((_resolve, reject) => {
        rejectRead = reject;
      }),
    );
    harness.changeUnverifiedEmail.mockResolvedValueOnce({ user: account({ email: 'next@example.com' }) });
    click(view.container, 'Изменить адрес');
    fill(view.container, 'Электронная почта', 'next@example.com');
    click(view.container, 'Сохранить адрес');
    await flush();
    expect(view.client.getQueryData<User>(authKeys.session)?.email).toBe('next@example.com');
    harness.user = account({ email: 'next@example.com' });
    act(() => harness.redraw());
    await flush();
    expect(view.container.textContent).toContain('Проверяем статус подтверждения…');
    await act(async () => {
      rejectRead(new ApiClientError('synthetic-network', { kind: 'network', status: 0, code: null }));
    });
    await flush();
    expect(view.container.textContent).toContain('Не удалось прочитать статус подтверждения.');
    expect([...view.container.querySelectorAll('button')].some((button) => button.textContent === 'Повторить чтение')).toBe(true);
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    expect(harness.verifyEmailVerification).not.toHaveBeenCalled();
    harness.emailVerificationState.mockResolvedValue(verificationState({ email: 'next@example.com' }));
    click(view.container, 'Повторить чтение');
    await flush();
    expect(view.container.textContent).toContain('Код ещё не отправлен.');
    expect(view.container.textContent).not.toContain('Не удалось прочитать');
    expect([...view.container.querySelectorAll('button')].some((button) => button.textContent === 'Повторить чтение')).toBe(false);
    expect(harness.emailVerificationState).toHaveBeenCalledTimes(3);
    expect(harness.changeUnverifiedEmail).toHaveBeenCalledTimes(1);
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    expect(view.client.getQueryData<User>(authKeys.session)?.email).toBe('next@example.com');
    view.unmount();
  });

  it('keeps a rejected code until it is edited', async () => {
    harness.user = account();
    harness.emailVerificationState.mockResolvedValue(verificationState({
      sendStatus: 'accepted',
      codeExpiresAt: '2026-10-10T08:10:00.000Z',
    }));
    const view = mount();
    await flush();
    fill(view.container, 'Код из письма', '123456');
    harness.verifyEmailVerification.mockRejectedValueOnce(new ApiClientError('invalid', {
      kind: 'forbidden',
      status: 403,
      code: ApiErrorCode.OTP_INVALID,
    }));
    click(view.container, 'Завершить');
    await flush();
    expect(view.container.textContent).toContain('Измените его, затем повторите проверку.');
    expect((view.container.querySelector('[aria-label="Код из письма"]') as HTMLInputElement).value).toBe('123456');
    click(view.container, 'Завершить');
    expect(harness.verifyEmailVerification).toHaveBeenCalledTimes(1);
    fill(view.container, 'Код из письма', '654321');
    harness.verifyEmailVerification.mockResolvedValueOnce({ ok: true });
    harness.me.mockResolvedValue({ user: account({ emailVerifiedAt: '2026-10-10T08:06:00.000Z' }) });
    click(view.container, 'Завершить');
    await flush();
    expect(harness.verifyEmailVerification).toHaveBeenCalledTimes(2);
    expect(harness.replace).toHaveBeenCalledWith('/profile');
    view.unmount();
  });

  it('changes the unverified address without sending mail and keeps the account', async () => {
    harness.user = account();
    harness.emailVerificationState.mockResolvedValue(verificationState());
    const view = mount();
    await flush();
    click(view.container, 'Изменить адрес');
    fill(view.container, 'Электронная почта', 'next@example.com');
    harness.changeUnverifiedEmail.mockResolvedValue({
      user: account({ email: 'next@example.com' }),
    });
    harness.emailVerificationState.mockResolvedValue(verificationState({
      email: 'next@example.com',
      sendStatus: 'none',
    }));
    click(view.container, 'Сохранить адрес');
    await flush();
    expect(harness.changeUnverifiedEmail).toHaveBeenCalledWith(
      { email: 'next@example.com' },
      expect.any(Object),
    );
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    expect(view.container.textContent).toContain('Прежний код больше не действует. Письмо не отправлено.');
    expect(view.client.getQueryData<User>(authKeys.session)).toMatchObject({
      id: OWNER_ID,
      email: 'next@example.com',
      slug: 'author',
      acceptedRulesVersion: 'MVP_RULES_V1',
    });
    view.unmount();
  });

  it('does not leave the screen for a stale verification', async () => {
    harness.user = account();
    harness.emailVerificationState.mockResolvedValue(verificationState({
      sendStatus: 'accepted',
      codeExpiresAt: '2026-10-10T08:10:00.000Z',
    }));
    const view = mount();
    await flush();
    fill(view.container, 'Код из письма', '123456');
    let finishMe: (value: { user: User }) => void = () => undefined;
    harness.verifyEmailVerification.mockResolvedValue({ ok: true });
    harness.me.mockImplementation(() => new Promise((resolve) => {
      finishMe = resolve;
    }));
    click(view.container, 'Завершить');
    await flush();
    harness.focused = false;
    act(() => harness.redraw());
    await act(async () => {
      finishMe({
        user: account({ emailVerifiedAt: '2026-10-10T08:06:00.000Z' }),
      });
    });
    await flush();
    expect(harness.replace).not.toHaveBeenCalled();
    view.unmount();
  });
});
