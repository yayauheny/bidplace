/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { flush } from '../../testing/dom';
import { authKeys, replaceAuthenticatedSession } from '../../lib/query-cache';
import type { User } from '@bidplace/contracts';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const harness = vi.hoisted(() => ({
  focused: true,
  failRulesOnce: false,
  blurDuringRegister: false,
  holdRegister: false,
  releaseRegister: null as null | (() => void),
  emitBlur: () => undefined as void,
  rulesReads: 0,
  registers: 0,
  accepts: [] as Array<{ version: string; userId: string | null }>,
  replace: vi.fn(),
  identify: vi.fn(),
  tick: () => undefined as void,
  client: null as QueryClient | null,
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Text: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  ScrollView: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Pressable: ({
    children,
    onPress,
    accessibilityRole,
    accessibilityLabel,
  }: {
    children?: ReactNode;
    onPress?: () => void;
    accessibilityRole?: string;
    accessibilityLabel?: string;
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        role: accessibilityRole,
        'aria-label': accessibilityLabel,
        onClick: () => onPress?.(),
      },
      children,
    ),
  TextInput: () => createElement('input'),
}));

vi.mock('react-native-svg', () => ({
  Svg: ({ children }: { children?: ReactNode }) => createElement('svg', null, children),
  Path: () => null,
  Circle: () => null,
  Ellipse: () => null,
}));

vi.mock('../../components/figma/FigmaButton', () => ({
  FigmaButton: () => null,
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

vi.mock('../../providers/analytics-provider', () => ({
  useAnalytics: () => ({
    track: vi.fn(),
    identify: harness.identify,
  }),
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    auth: {
      me: async () => {
        const current = client().getQueryData<User | null>(authKeys.session);
        if (!current) throw new Error('anonymous');
        if (current.id === 'user-a' && harness.accepts.length > 1) {
          return { user: { ...current, acceptedRulesVersion: 'MVP_RULES_V1' } };
        }
        return { user: current };
      },
      register: (input: { email: string; slug: string }) => {
        harness.registers += 1;
        const user = account('user-a', input.email, input.slug);
        if (harness.blurDuringRegister) {
          harness.focused = false;
          harness.emitBlur();
        }
        if (harness.holdRegister) {
          return new Promise((resolve) => {
            harness.releaseRegister = () => resolve({ user });
          });
        }
        return Promise.resolve({ user });
      },
      getRules: async () => {
        harness.rulesReads += 1;
        if (harness.failRulesOnce && harness.rulesReads === 1) {
          throw new Error('rules down');
        }
        return {
          rules: {
            version: 'MVP_RULES_V1',
            owner: 'bidplace',
            contact: 'support@bidplace.test',
            text: 'Published rules text',
            updatedAt: null,
          },
        };
      },
      acceptRules: async (input: { rulesVersion: string }) => {
        const session = client().getQueryData<User | null>(authKeys.session);
        harness.accepts.push({
          version: input.rulesVersion,
          userId: session?.id ?? null,
        });
        if (harness.accepts.length === 1) throw new Error('failed');
        return { user: session };
      },
    },
  }),
}));

vi.mock('./use-slug-availability', () => ({
  useSlugAvailability: () => null,
}));

vi.mock('./auth-password-field', () => ({
  AuthPasswordField: ({
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

vi.mock('../../components/ui', () => ({
  AppDialog: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: string;
    children?: ReactNode;
  }) => (open ? createElement('div', { role: 'dialog' }, title, children) : null),
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

import { AuthProvider } from '../../providers/auth-provider';
import { RegisterForm } from './auth-form';

function client() {
  if (!harness.client) throw new Error('Missing query client');
  return harness.client;
}

function account(id: string, email: string, slug: string): User {
  return {
    id,
    email,
    slug,
    displayName: null,
    phone: null,
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    acceptedRulesVersion: null,
    role: 'user',
    status: 'active',
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  };
}

function Host() {
  return createElement(AuthProvider, null, createElement(RegisterForm, { redirectTo: '/profile' }));
}

function mount() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(authKeys.session, null);
  harness.client = queryClient;
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(createElement(QueryClientProvider, { client: queryClient }, createElement(Host)));
  });
  return {
    container,
    client: queryClient,
    unmount() {
      act(() => {
        root.unmount();
      });
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
  });
}

function clickConsent(container: ParentNode) {
  const box = container.querySelector('[role="checkbox"]');
  if (!box) throw new Error('Missing checkbox');
  act(() => {
    if (box instanceof HTMLElement) box.click();
  });
}

function clickButton(container: ParentNode, label: string) {
  const button = [...container.querySelectorAll('button')].find((item) => item.textContent === label);
  if (!button) throw new Error(`Missing ${label}`);
  act(() => {
    button.click();
  });
}

async function until(container: ParentNode, marker: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (container.textContent?.includes(marker)) return;
    await flush();
  }
  throw new Error(`Timed out waiting for ${marker}. Body: ${container.textContent}`);
}

async function reachPassword(container: HTMLElement) {
  await until(container, 'Введите вашу почту');
  fill(container, 'Электронная почта', 'a@example.com');
  clickConsent(container);
  await until(container, 'Правила сервиса');
  clickButton(container, 'Дальше');
  await until(container, 'Выберите имя пользователя');
  fill(container, 'Никнейм', 'author-a');
  clickButton(container, 'Дальше');
  await until(container, 'Создайте пароль');
  fill(container, 'Введите пароль', 'registration-password-123');
  fill(container, 'Подтвердите пароль', 'registration-password-123');
}

afterEach(() => {
  document.body.replaceChildren();
  harness.focused = true;
  harness.failRulesOnce = false;
  harness.blurDuringRegister = false;
  harness.holdRegister = false;
  harness.releaseRegister = null;
  harness.rulesReads = 0;
  harness.registers = 0;
  harness.accepts = [];
  harness.replace.mockReset();
  harness.identify.mockReset();
  harness.client = null;
});

describe('registration consent attempt', () => {
  it('reloads rules without toggling the checkbox', async () => {
    harness.failRulesOnce = true;
    const view = mount();
    await until(view.container, 'Введите вашу почту');
    fill(view.container, 'Электронная почта', 'a@example.com');
    clickConsent(view.container);
    await until(view.container, 'Не удалось получить правила.');
    expect(view.container.textContent).not.toContain('Правила сервиса');
    clickButton(view.container, 'Повторить');
    await until(view.container, 'Правила сервиса');
    clickButton(view.container, 'Правила сервиса');
    await until(view.container, 'Published rules text');
    expect(harness.rulesReads).toBe(2);
    expect(harness.registers).toBe(0);
    view.unmount();
  });

  it('keeps a failed acceptance on account A and does not send it for account B', async () => {
    const view = mount();
    await reachPassword(view.container);
    clickButton(view.container, 'Дальше');
    await until(view.container, 'Не удалось сохранить согласие. Повторите принятие правил.');
    expect(harness.registers).toBe(1);
    expect(harness.accepts).toEqual([{ version: 'MVP_RULES_V1', userId: 'user-a' }]);
    expect(harness.replace).not.toHaveBeenCalled();

    await act(async () => {
      await replaceAuthenticatedSession(view.client, account('user-b', 'b@example.com', 'author-b'));
    });
    await flush();
    expect(view.container.textContent).toContain('Сессия изменилась. Согласие не перенесено.');
    clickButton(view.container, 'Дальше');
    await flush();
    expect(harness.registers).toBe(1);
    expect(harness.accepts).toHaveLength(1);
    expect(harness.accepts[0]?.userId).toBe('user-a');
    expect(harness.replace).not.toHaveBeenCalled();
    view.unmount();
  });

  it('does not accept rules after the route loses focus while staying mounted', async () => {
    harness.blurDuringRegister = true;
    const view = mount();
    await reachPassword(view.container);
    clickButton(view.container, 'Дальше');
    await flush();
    await flush();
    expect(harness.registers).toBe(1);
    expect(harness.accepts).toHaveLength(0);
    expect(harness.replace).not.toHaveBeenCalled();
    expect(view.container.isConnected).toBe(true);
    view.unmount();
  });

  it('does not apply a late registration over a newer session', async () => {
    harness.holdRegister = true;
    const view = mount();
    await reachPassword(view.container);
    clickButton(view.container, 'Дальше');
    for (let attempt = 0; attempt < 20 && harness.registers === 0; attempt += 1) {
      await flush();
    }
    expect(harness.registers).toBe(1);
    await act(async () => {
      await replaceAuthenticatedSession(view.client, account('user-b', 'b@example.com', 'author-b'));
    });
    await flush();
    await act(async () => {
      harness.releaseRegister?.();
    });
    await flush();
    await flush();
    expect(view.client.getQueryData<User | null>(authKeys.session)?.id).toBe('user-b');
    expect(harness.accepts).toHaveLength(0);
    expect(harness.replace).not.toHaveBeenCalled();
    expect(harness.registers).toBe(1);
    expect(view.container.textContent).toContain('Сессия изменилась. Согласие не перенесено.');
    clickButton(view.container, 'Дальше');
    await flush();
    expect(harness.registers).toBe(1);
    expect(harness.accepts).toHaveLength(0);
    expect(harness.replace).not.toHaveBeenCalled();
    view.unmount();
  });

  it('navigates once when the same account retries acceptance', async () => {
    const view = mount();
    await reachPassword(view.container);
    clickButton(view.container, 'Дальше');
    await until(view.container, 'Не удалось сохранить согласие. Повторите принятие правил.');
    clickButton(view.container, 'Дальше');
    for (let attempt = 0; attempt < 20 && harness.replace.mock.calls.length === 0; attempt += 1) {
      await flush();
    }
    expect(harness.registers).toBe(1);
    expect(harness.accepts.map((item) => item.userId)).toEqual(['user-a', 'user-a']);
    expect(harness.replace).toHaveBeenCalledTimes(1);
    view.unmount();
  });
});
