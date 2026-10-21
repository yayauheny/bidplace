/**
 * @vitest-environment jsdom
 */
import { act, createElement, useLayoutEffect, useSyncExternalStore, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiErrorCode } from '@bidplace/contracts';
import { ApiClientError } from '@bidplace/api-client';

import { flush } from '../../testing/dom';
import {
  AUTH_CREDENTIALS_COPY,
  AUTH_RATE_LIMIT_COPY,
  AUTH_RECOVERY_ACCEPTED_COPY,
  AUTH_TURNSTILE_REQUIRED_COPY,
} from '../../errors';
import { advanceAuthEpoch, authKeys } from '../../lib/query-cache';
import { ForgotPasswordForm } from './forgot-password-form';
import { LoginForm } from './auth-form';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const authBridge = vi.hoisted(() => {
  let revision = 0;
  const listeners = new Set<() => void>();
  return {
    revision: () => revision,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    bump() {
      revision += 1;
      listeners.forEach((listener) => listener());
    },
  };
});

const harness = vi.hoisted(() => ({
  focused: true,
  emitBlur: () => undefined as void,
  proof: null as string | null,
  availability: 'ready' as 'ready' | 'unavailable',
  user: null as { id: string; email: string; slug: string; acceptedRulesVersion: null } | null,
  bump: () => authBridge.bump(),
  login: vi.fn(),
  forgot: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('react-native-svg', () => ({
  Svg: ({ children }: { children?: ReactNode }) => createElement('svg', null, children),
  Path: () => null,
  Circle: () => null,
  Ellipse: () => null,
}));

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('react-native', () => ({
  useWindowDimensions: () => ({ width: 390, height: 874, scale: 1, fontScale: 1 }),
  Platform: { OS: 'web' },
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Text: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  Pressable: ({
    children,
    onPress,
  }: {
    children?: ReactNode;
    onPress?: () => void;
  }) => createElement('button', { type: 'button', onClick: () => onPress?.() }, children),
  TextInput: () => createElement('input'),
  StyleSheet: { create: (styles: unknown) => styles },
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({ replace: harness.replace, push: vi.fn() }),
  useIsFocused: () => harness.focused,
  useNavigation: () => ({
    addListener: (event: string, listener: () => void) => {
      if (event === 'blur') harness.emitBlur = listener;
      return () => undefined;
    },
  }),
  Link: ({ children }: { children?: ReactNode }) => createElement('a', null, children),
}));

vi.mock('../../providers/auth-provider', () => ({
  useAuth: () => {
    useSyncExternalStore(authBridge.subscribe, authBridge.revision, authBridge.revision);
    return {
      ready: true,
      isAuthenticated: harness.user !== null,
      login: harness.login,
      register: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
      user: harness.user,
    };
  },
  registerSessionChangeIsOwn: () => false,
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    auth: {
      getRules: async () => ({ rules: { text: 'Published rules text' } }),
      forgotPassword: harness.forgot,
    },
  }),
}));

vi.mock('../../providers/analytics-provider', () => ({
  useAnalytics: () => ({ track: vi.fn(), identify: vi.fn() }),
}));

vi.mock('./auth-password-field', () => ({
  AuthPasswordField: ({
    label,
    value,
    onChangeText,
  }: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
  }) =>
    createElement('input', {
      'aria-label': label,
      value,
      onChange: (event: { target: { value: string } }) => onChangeText(event.target.value),
    }),
}));

vi.mock('./auth-google-icon', () => ({ AuthGoogleIcon: () => null }));
vi.mock('./auth-telegram-icon', () => ({ AuthTelegramIcon: () => null }));
vi.mock('./auth-legal-text', () => ({
  AUTH_POLICY_STUB_TITLE: 'policy',
  AUTH_POLICY_STUB_BODY: 'policy-body',
  AuthLegalText: () => null,
}));
vi.mock('../../components/ui/MotionPressable', () => ({
  MotionPressable: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
}));
vi.mock('../../components/figma/FigmaButton', () => ({
  FigmaButton: ({ label }: { label: string }) => createElement('button', { type: 'button' }, label),
}));
vi.mock('../../components/ui', () => ({
  AppDialog: () => null,
  AppText: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  PrimaryButton: ({
    label,
    onPress,
  }: {
    label: string;
    onPress?: () => void;
  }) => createElement('button', { type: 'button', onClick: () => onPress?.() }, label),
  TextButton: ({
    label,
    onPress,
  }: {
    label: string;
    onPress?: () => void;
  }) => createElement('button', { type: 'button', onClick: () => onPress?.() }, label),
  TextField: ({
    label,
    value,
    onChangeText,
  }: {
    label: string;
    value?: string;
    onChangeText?: (value: string) => void;
  }) =>
    createElement('input', {
      'aria-label': label,
      value: value ?? '',
      onChange: (event: { target: { value: string } }) => onChangeText?.(event.target.value),
    }),
}));

vi.mock('./turnstile-widget', () => ({
  TurnstileWidget: ({
    onToken,
    onAvailability,
  }: {
    onToken: (token: string | null) => void;
    onAvailability: (availability: 'ready' | 'unavailable') => void;
  }) => {
    const issued = harness.proof;
    useLayoutEffect(() => {
      onAvailability(harness.availability);
      if (issued) onToken(issued);
    }, [issued, onAvailability, onToken]);
    return createElement('div', { 'data-turnstile': 'challenge' });
  },
}));

function SessionHost({ children }: { children?: ReactNode }) {
  return children;
}

function mount(node: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(authKeys.session, null);
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(createElement(QueryClientProvider, { client: queryClient }, createElement(SessionHost, null, node)));
  });
  return {
    container,
    client: queryClient,
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
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

function click(container: ParentNode, label: string) {
  const target = [...container.querySelectorAll('button')].find((button) => button.textContent === label);
  if (!target) throw new Error(`Missing ${label}`);
  act(() => {
    target.click();
  });
}

function defer<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function installed(id: string) {
  return { id, email: `${id}@example.com`, slug: id, acceptedRulesVersion: null };
}

afterEach(() => {
  document.body.replaceChildren();
  harness.focused = true;
  harness.user = null;
  harness.proof = null;
  harness.availability = 'ready';
  harness.login.mockReset();
  harness.forgot.mockReset();
  harness.replace.mockReset();
});

describe('login submit ownership', () => {
  it('navigates only after this login installs the same user', async () => {
    const view = mount(createElement(LoginForm));
    harness.login.mockImplementation(async () => {
      const user = installed('user-1');
      view.client.setQueryData(authKeys.session, user);
      harness.user = user;
      await act(async () => {
        harness.bump();
      });
      return { user: { id: user.id } };
    });
    fill(view.container, 'Электронная почта', 'a@example.com');
    fill(view.container, 'Пароль', 'secret');
    click(view.container, 'Войти');
    await flush();
    expect(harness.login).toHaveBeenCalledTimes(1);
    expect(harness.replace).toHaveBeenCalledTimes(1);
    expect(harness.replace).toHaveBeenCalledWith('/');
    view.unmount();
  });

  it('completes exactly once after auth context catches up to an owned receipt', async () => {
    const view = mount(createElement(LoginForm));
    const user = installed('user-1');
    harness.login.mockImplementation(async () => {
      view.client.setQueryData(authKeys.session, user);
      return { user: { id: user.id } };
    });
    fill(view.container, 'Электронная почта', 'a@example.com');
    fill(view.container, 'Пароль', 'secret');
    click(view.container, 'Войти');
    await flush();
    expect(harness.replace).not.toHaveBeenCalled();
    harness.user = user;
    await act(async () => {
      harness.bump();
    });
    await flush();
    expect(harness.replace).toHaveBeenCalledTimes(1);
    expect(harness.replace).toHaveBeenCalledWith('/');
    view.unmount();
  });

  it('does not complete when the private cache epoch advances after the receipt is admitted', async () => {
    const view = mount(createElement(LoginForm));
    const user = installed('user-1');
    harness.login.mockImplementation(async () => {
      view.client.setQueryData(authKeys.session, user);
      return { user: { id: user.id } };
    });
    fill(view.container, 'Электронная почта', 'a@example.com');
    fill(view.container, 'Пароль', 'secret');
    click(view.container, 'Войти');
    await flush();
    act(() => {
      advanceAuthEpoch(view.client);
    });
    harness.user = user;
    await act(async () => {
      harness.bump();
    });
    await flush();
    expect(harness.replace).not.toHaveBeenCalled();
    view.unmount();
  });

  it('does not navigate when another user is installed', async () => {
    const view = mount(createElement(LoginForm));
    harness.login.mockImplementation(async () => {
      view.client.setQueryData(authKeys.session, installed('user-2'));
      return { user: { id: 'user-1' } };
    });
    fill(view.container, 'Электронная почта', 'a@example.com');
    fill(view.container, 'Пароль', 'secret');
    click(view.container, 'Войти');
    await flush();
    expect(harness.replace).not.toHaveBeenCalled();
    view.unmount();
  });

  it('does not navigate after blur and does not reject the submit', async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);
    const pending = defer<{ user: { id: string } }>();
    harness.login.mockReturnValue(pending.promise);
    const view = mount(createElement(LoginForm));
    fill(view.container, 'Электронная почта', 'a@example.com');
    fill(view.container, 'Пароль', 'secret');
    click(view.container, 'Войти');
    await flush();
    act(() => harness.emitBlur());
    view.client.setQueryData(authKeys.session, installed('user-1'));
    await act(async () => {
      pending.resolve({ user: { id: 'user-1' } });
    });
    await flush();
    expect(harness.replace).not.toHaveBeenCalled();
    expect(unhandled).toEqual([]);
    process.off('unhandledRejection', onUnhandled);
    view.unmount();
  });

  it('ignores a second press and an edited password', async () => {
    const pending = defer<{ user: { id: string } }>();
    harness.login.mockReturnValue(pending.promise);
    const view = mount(createElement(LoginForm));
    fill(view.container, 'Электронная почта', 'a@example.com');
    fill(view.container, 'Пароль', 'secret');
    click(view.container, 'Войти');
    await flush();
    click(view.container, 'Войти');
    fill(view.container, 'Пароль', 'secret-2');
    view.client.setQueryData(authKeys.session, installed('user-1'));
    await act(async () => {
      pending.resolve({ user: { id: 'user-1' } });
    });
    await flush();
    expect(harness.login).toHaveBeenCalledTimes(1);
    expect(harness.replace).not.toHaveBeenCalled();
    view.unmount();
  });

  it('asks for a fresh proof after the server requires one and sends that proof', async () => {
    const view = mount(createElement(LoginForm));
    harness.login.mockRejectedValueOnce(
      new ApiClientError('challenge', {
        kind: 'bad_request',
        status: 400,
        code: ApiErrorCode.TURNSTILE_REQUIRED,
      }),
    );
    fill(view.container, 'Электронная почта', 'a@example.com');
    fill(view.container, 'Пароль', 'secret');
    click(view.container, 'Войти');
    await flush();
    expect(view.container.querySelector('[data-turnstile="challenge"]')).not.toBeNull();
    expect(view.container.textContent).toContain(AUTH_TURNSTILE_REQUIRED_COPY);
    click(view.container, 'Войти');
    await flush();
    expect(harness.login).toHaveBeenCalledTimes(1);
    harness.proof = 'proof-a';
    fill(view.container, 'Пароль', 'secret-2');
    expect(view.container.querySelector('[data-turnstile="challenge"]')).not.toBeNull();
    expect(view.container.textContent).toContain(AUTH_TURNSTILE_REQUIRED_COPY);
    harness.login.mockImplementationOnce(async () => {
      view.client.setQueryData(authKeys.session, installed('user-1'));
      return { user: { id: 'user-1' } };
    });
    fill(view.container, 'Электронная почта', 'b@example.com');
    expect(view.container.querySelector('[data-turnstile="challenge"]')).toBeNull();
    expect(view.container.textContent).not.toContain(AUTH_TURNSTILE_REQUIRED_COPY);
    click(view.container, 'Войти');
    await flush();
    expect(harness.login).toHaveBeenLastCalledWith(
      { email: 'b@example.com', password: 'secret-2' },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    harness.proof = 'widget-token';
    view.unmount();
    const again = mount(createElement(LoginForm));
    harness.login
      .mockRejectedValueOnce(
        new ApiClientError('challenge', {
          kind: 'bad_request',
          status: 400,
          code: ApiErrorCode.TURNSTILE_REQUIRED,
        }),
      )
      .mockImplementationOnce(async () => {
        const sessionUser = installed('user-1');
        again.client.setQueryData(authKeys.session, sessionUser);
        harness.user = sessionUser;
        await act(async () => {
          harness.bump();
        });
        return { user: { id: 'user-1' } };
      });
    fill(again.container, 'Электронная почта', 'a@example.com');
    fill(again.container, 'Пароль', 'secret');
    click(again.container, 'Войти');
    await flush();
    click(again.container, 'Войти');
    await flush();
    expect(harness.login).toHaveBeenLastCalledWith(
      expect.objectContaining({ turnstileToken: 'widget-token' }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(harness.replace).toHaveBeenCalledWith('/');
    again.unmount();
  });

  it('keeps the credential and rate-limit copies distinct', async () => {
    const view = mount(createElement(LoginForm));
    harness.login.mockRejectedValueOnce(
      new ApiClientError('no', { kind: 'unauthorized', status: 401 }),
    );
    fill(view.container, 'Электронная почта', 'a@example.com');
    fill(view.container, 'Пароль', 'secret');
    click(view.container, 'Войти');
    await flush();
    expect(view.container.textContent).toContain(AUTH_CREDENTIALS_COPY);
    expect(view.container.querySelector('[data-turnstile="challenge"]')).toBeNull();
    harness.login.mockRejectedValueOnce(
      new ApiClientError('slow', { kind: 'rate_limited', status: 429, code: ApiErrorCode.RATE_LIMITED }),
    );
    click(view.container, 'Войти');
    await flush();
    expect(view.container.textContent).toContain(AUTH_RATE_LIMIT_COPY);
    expect(view.container.textContent).not.toContain(AUTH_CREDENTIALS_COPY);
    view.unmount();
  });
});

describe('recovery submit ownership', () => {
  it('shows a neutral result and rotates the key only for a definite outcome or a new email', async () => {
    harness.proof = 'widget-token';
    const view = mount(createElement(ForgotPasswordForm));
    fill(view.container, 'Электронная почта', 'A@Example.com');
    const offline = new ApiClientError('offline', { kind: 'network', status: 0 });
    harness.forgot.mockRejectedValueOnce(offline).mockRejectedValueOnce(offline);
    click(view.container, 'Отправить ссылку');
    await flush();
    await flush();
    const first = harness.forgot.mock.calls[0]?.[0] as { idempotencyKey: string; email: string };
    click(view.container, 'Отправить ссылку');
    await flush();
    const second = harness.forgot.mock.calls[1]?.[0] as { idempotencyKey: string };
    expect(second.idempotencyKey).toBe(first.idempotencyKey);
    expect(first.email).toBe('A@Example.com');
    fill(view.container, 'Электронная почта', 'b@example.com');
    harness.forgot.mockResolvedValueOnce({ accepted: true });
    click(view.container, 'Отправить ссылку');
    await flush();
    const third = harness.forgot.mock.calls[2]?.[0] as { idempotencyKey: string; email: string };
    expect(third.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(third.email).toBe('b@example.com');
    expect(view.container.textContent).toContain(AUTH_RECOVERY_ACCEPTED_COPY);
    expect(view.container.textContent).not.toContain('Письмо отправлено');
    view.unmount();
  });

  it('does not complete a recovery after the session changes or the request aborts', async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);
    harness.proof = 'widget-token';
    const pending = defer<void>();
    harness.forgot.mockReturnValue(pending.promise);
    const view = mount(createElement(ForgotPasswordForm));
    fill(view.container, 'Электронная почта', 'a@example.com');
    click(view.container, 'Отправить ссылку');
    await flush();
    const firstKey = (harness.forgot.mock.calls[0]?.[0] as { idempotencyKey: string }).idempotencyKey;
    act(() => {
      advanceAuthEpoch(view.client);
    });
    await act(async () => pending.resolve());
    await flush();
    expect(view.container.textContent).not.toContain(AUTH_RECOVERY_ACCEPTED_COPY);
    const held = defer<void>();
    harness.forgot.mockReturnValueOnce(held.promise);
    click(view.container, 'Отправить ссылку');
    await flush();
    const heldCall = harness.forgot.mock.calls[1];
    const heldKey = (heldCall?.[0] as { idempotencyKey: string }).idempotencyKey;
    const heldSignal = (heldCall?.[1] as { signal: AbortSignal }).signal;
    expect(heldKey).toBe(firstKey);
    act(() => {
      advanceAuthEpoch(view.client);
      view.client.setQueryData(authKeys.session, installed('user-b'));
    });
    expect(heldSignal.aborted).toBe(true);
    await act(async () => {
      held.reject(
        new ApiClientError('slow', {
          kind: 'rate_limited',
          status: 429,
          code: ApiErrorCode.RATE_LIMITED,
        }),
      );
    });
    await flush();
    expect(view.container.textContent).not.toContain(AUTH_RECOVERY_ACCEPTED_COPY);
    expect(view.container.textContent).not.toContain(AUTH_RATE_LIMIT_COPY);
    expect(view.client.getQueryData(authKeys.session)).toEqual(installed('user-b'));
    expect(harness.replace).not.toHaveBeenCalled();
    harness.forgot.mockRejectedValueOnce(
      new ApiClientError('slow', {
        kind: 'rate_limited',
        status: 429,
        code: ApiErrorCode.RATE_LIMITED,
      }),
    );
    click(view.container, 'Отправить ссылку');
    await flush();
    const currentKey = (harness.forgot.mock.calls[2]?.[0] as { idempotencyKey: string }).idempotencyKey;
    expect(currentKey).toBe(heldKey);
    expect(view.container.textContent).toContain(AUTH_RATE_LIMIT_COPY);
    expect(view.container.textContent).not.toContain(AUTH_RECOVERY_ACCEPTED_COPY);
    expect(view.client.getQueryData(authKeys.session)).toEqual(installed('user-b'));
    harness.forgot.mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'));
    click(view.container, 'Отправить ссылку');
    await flush();
    expect(view.container.textContent).not.toContain(AUTH_RECOVERY_ACCEPTED_COPY);
    expect(unhandled).toEqual([]);
    process.off('unhandledRejection', onUnhandled);
    view.unmount();
  });

  it('does not crash the form when a recovery key cannot be created', async () => {
    harness.proof = 'widget-token';
    const randomUUID = vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(() => {
      throw new Error('unavailable');
    });
    const getRandomValues = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(() => {
      throw new Error('unavailable');
    });
    const view = mount(createElement(ForgotPasswordForm));
    fill(view.container, 'Электронная почта', 'a@example.com');
    click(view.container, 'Отправить ссылку');
    await flush();
    expect(harness.forgot).not.toHaveBeenCalled();
    expect(view.container.textContent).toContain('Не удалось подготовить запрос. Повторите попытку.');
    expect(view.container.isConnected).toBe(true);
    randomUUID.mockRestore();
    getRandomValues.mockRestore();
    view.unmount();
  });
});
