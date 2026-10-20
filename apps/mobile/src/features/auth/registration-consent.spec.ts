/**
 * @vitest-environment jsdom
 */
import { act, createElement, useLayoutEffect, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { flush } from '../../testing/dom';
import { authKeys, replaceAuthenticatedSession } from '../../lib/query-cache';
import { ApiErrorCode, type User } from '@bidplace/contracts';
import { ApiClientError } from '@bidplace/api-client';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const harness = vi.hoisted(() => ({
  focused: true,
  failLegalOnce: false,
  blurDuringRegister: false,
  holdRegister: false,
  releaseRegister: null as null | (() => void),
  emitBlur: () => undefined as void,
  legalReads: 0,
  registers: 0,
  lastRegister: null as null | { turnstileToken?: string; legal?: { agreement: {version: string}; privacy: {version: string}; dataConsent: {version: string}; age18Confirmed: boolean } },
  proof: 'widget-token' as string | null,
  availability: 'ready' as 'ready' | 'unavailable',
  registerError: null as unknown,
  slugAvailability: vi.fn<(slug: string) => Promise<{ available: boolean }>>(),
  replace: vi.fn(),
  identify: vi.fn(),
  openURL: vi.fn(),
  tick: () => undefined as void,
  client: null as QueryClient | null,
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  Linking: { openURL: harness.openURL },
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Text: ({
    children,
    onPress,
    accessibilityRole,
  }: {
    children?: ReactNode;
    onPress?: () => void;
    accessibilityRole?: string;
  }) =>
    onPress
      ? createElement(
          'button',
          {
            type: 'button',
            role: accessibilityRole ?? 'link',
            onClick: () => onPress(),
          },
          children,
        )
      : createElement('span', null, children),
  ScrollView: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Pressable: ({
    children,
    onPress,
    accessibilityRole,
    accessibilityLabel,
    accessibilityState,
    disabled,
  }: {
    children?: ReactNode;
    onPress?: () => void;
    accessibilityRole?: string;
    accessibilityLabel?: string;
    accessibilityState?: { checked?: boolean };
    disabled?: boolean;
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        role: accessibilityRole,
        'aria-label': accessibilityLabel,
        'aria-checked': accessibilityState?.checked,
        disabled,
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

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('../../components/figma/FigmaButton', () => ({
  FigmaButton: ({
    label,
    onPress,
    accessibilityHint,
  }: {
    label: string;
    onPress?: () => void;
    accessibilityHint?: string;
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        title: accessibilityHint,
        onClick: () => onPress?.(),
      },
      label,
    ),
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
        return { user: current };
      },
      register: (input: { email: string; slug: string; turnstileToken?: string }) => {
        harness.registers += 1;
        harness.lastRegister = input;
        if (harness.registerError) return Promise.reject(harness.registerError);
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
      slugAvailability: harness.slugAvailability,
      getLegalDocuments: async () => {
        harness.legalReads += 1;
        if (harness.failLegalOnce && harness.legalReads === 1) {
          throw new Error('legal unavailable');
        }
        const version = 'portfolio-legal-2026-10-12';
        return {
          version,
          documents: [
            { id: 'agreement', title: 'Пользовательское соглашение', version, markdown: '# Соглашение\n\nДоговор для портфолио.\n\n| Термин | Значение |\n| --- | --- |\n| Сервис | bidplace |\n\nhttps://bid.place/legal' },
            { id: 'privacy', title: 'Политика и cookies', version, markdown: '# Политика\\n\\nДанные.' },
            { id: 'data-consent', title: 'Согласие на обработку данных', version, markdown: '# Согласие\\n\\nОбработка.' },
            { id: 'author-rules', title: 'Правила авторов', version, markdown: '# Правила авторов' },
            { id: 'prohibited', title: 'Запрещённое', version, markdown: '# Запрещённое' },
          ],
        };
      },
    },
  }),
}));

vi.mock('./auth-password-field', () => ({
  AuthPasswordField: ({
    label,
    value,
    onChangeText,
    editable = true,
  }: {
    label: string;
    value?: string;
    onChangeText?: (value: string) => void;
    editable?: boolean;
  }) =>
    createElement('input', {
      'aria-label': label,
      value: value ?? '',
      disabled: !editable,
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
    disabled,
    accessibilityHint,
  }: {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
    accessibilityHint?: string;
  }) =>
    createElement(
      'button',
      { type: 'button', disabled, title: accessibilityHint, onClick: () => onPress?.() },
      label,
    ),
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
    error,
  }: {
    label: string;
    value?: string;
    onChangeText?: (value: string) => void;
    error?: string;
  }) =>
    createElement(
      'div',
      null,
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
      onToken,
      onAvailability,
    }: {
      onToken: (token: string | null) => void;
      onAvailability?: (availability: 'ready' | 'unavailable') => void;
    }) => {
      useLayoutEffect(() => {
        onAvailability?.(harness.availability);
        if (harness.proof) onToken(harness.proof);
      }, [onToken, onAvailability]);
      return createElement('div', { 'data-turnstile': 'register' });
    },
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

function clickAllConsents(container: ParentNode) {
  const boxes = [...container.querySelectorAll('[role="checkbox"]')];
  if (boxes.length !== 4) throw new Error('Expected four distinct legal confirmations');
  for (const box of boxes) act(() => { if (box instanceof HTMLElement) box.click(); });
}

function clickButton(container: ParentNode, label: string) {
  const button = [...container.querySelectorAll('button')].find((item) => item.textContent === label);
  if (!button) throw new Error(`Missing ${label}`);
  act(() => {
    button.click();
  });
}

function clickLegalLink(container: ParentNode, label: string) {
  const link = [...container.querySelectorAll('[role="link"]')].find((item) =>
    item.textContent?.includes(label),
  );
  if (!link) throw new Error(`Missing link ${label}`);
  act(() => {
    if (link instanceof HTMLElement) link.click();
  });
}

async function until(
  container: ParentNode,
  marker: string | (() => boolean),
  description = typeof marker === 'string' ? marker : 'condition',
) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (
      typeof marker === 'string'
        ? container.textContent?.includes(marker)
        : marker()
    )
      return;
    await flush();
  }
  throw new Error(`Timed out waiting for ${description}. Body: ${container.textContent}`);
}

async function reachNickname(container: HTMLElement) {
  await until(container, 'Введите вашу почту');
  fill(container, 'Электронная почта', 'a@example.com');
  await until(container, 'Редакция документов: portfolio-legal-2026-10-12');
  await until(container, () => {
    const boxes = [...container.querySelectorAll('[role="checkbox"]')];
    return boxes.length === 4 && boxes.every((node) => node instanceof HTMLButtonElement && !node.disabled);
  }, 'four enabled legal checkboxes');
  clickAllConsents(container);
  clickButton(container, 'Дальше');
  await until(container, 'Выберите имя пользователя');
}

async function reachPassword(container: HTMLElement) {
  await reachNickname(container);
  const suggestions = [
    ...container.querySelectorAll(
      'button[title="Заполнить поле никнейма"]',
    ),
  ].map((button) => button.textContent);
  fill(container, 'Никнейм', 'author-a');
  clickButton(container, 'Дальше');
  await until(container, 'Создайте пароль');
  fill(container, 'Введите пароль', 'registration-password-123');
  fill(container, 'Подтвердите пароль', 'registration-password-123');
  return suggestions;
}

beforeEach(() => {
  harness.slugAvailability.mockReset();
  harness.slugAvailability.mockResolvedValue({ available: true });
});

afterEach(() => {
  document.body.replaceChildren();
  harness.focused = true;
  harness.failLegalOnce = false;
  harness.blurDuringRegister = false;
  harness.holdRegister = false;
  harness.releaseRegister = null;
  harness.legalReads = 0;
  harness.registers = 0;
  harness.lastRegister = null;
  harness.proof = 'widget-token';
  harness.availability = 'ready';
  harness.registerError = null;
  harness.slugAvailability.mockReset();
  harness.replace.mockReset();
  harness.identify.mockReset();
  harness.openURL.mockReset();
  harness.client = null;
});

describe('registration consent attempt', () => {
  it('keeps Next disabled until every confirmation is checked and still reports a bad email', async () => {
    const view = mount();
    await until(view.container, 'Редакция документов: portfolio-legal-2026-10-12');
    const next = [...view.container.querySelectorAll('button')].find(
      (item) => item.textContent === 'Дальше',
    );
    expect(next).toBeInstanceOf(HTMLButtonElement);
    const nextButton = next as HTMLButtonElement;
    expect(nextButton.disabled).toBe(true);
    expect(nextButton.title).toBe('Отметьте все обязательные согласия');
    const boxes = [...view.container.querySelectorAll('[role="checkbox"]')];
    expect(boxes).toHaveLength(4);
    expect(boxes.every((node) => node instanceof HTMLButtonElement && !node.disabled)).toBe(true);
    for (const box of boxes.slice(0, 3)) {
      act(() => {
        if (box instanceof HTMLElement) box.click();
      });
    }
    await flush();
    expect(nextButton.disabled).toBe(true);
    fill(view.container, 'Электронная почта', 'not-an-email');
    clickButton(view.container, 'Дальше');
    await flush();
    expect(view.container.textContent).toContain('Введите вашу почту');
    expect(view.container.textContent).not.toContain('Примите пользовательское соглашение');
    expect(view.container.textContent).not.toContain('Подтвердите, что вам исполнилось 18 лет');
    act(() => {
      if (boxes[3] instanceof HTMLElement) boxes[3].click();
    });
    await flush();
    expect(nextButton.disabled).toBe(false);
    clickButton(view.container, 'Дальше');
    await until(view.container, 'Введите корректный email');
    expect(view.container.textContent).toContain('Введите вашу почту');
    fill(view.container, 'Электронная почта', 'a@example.com');
    clickButton(view.container, 'Дальше');
    await until(view.container, 'Выберите имя пользователя');
    view.unmount();
  });

  it('keeps all confirmations disabled until a published legal pack is loaded', async () => {
    const view = mount();
    // The simulated transport is async; once resolved, four unchecked controls are available.
    await until(view.container, 'Редакция документов: portfolio-legal-2026-10-12');
    expect([...view.container.querySelectorAll('[role="checkbox"]')]).toHaveLength(4);
    expect([...view.container.querySelectorAll('[role="checkbox"]')].every(
      (node) => node.getAttribute('aria-checked') === 'false',
    )).toBe(true);
    view.unmount();
  });


  it('checks only on Next, blocks duplicate requests, and advances on available', async () => {
    let resolveAvailability: (value: { available: boolean }) => void = () =>
      undefined;
    harness.slugAvailability.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveAvailability = resolve;
        }),
    );
    const view = mount();
    await reachNickname(view.container);
    expect(harness.slugAvailability).not.toHaveBeenCalled();

    fill(view.container, 'Никнейм', 'typed-author');
    await flush();
    expect(harness.slugAvailability).not.toHaveBeenCalled();

    const suggestion = view.container.querySelector(
      'button[title="Заполнить поле никнейма"]',
    );
    expect(suggestion?.textContent).toBeTruthy();
    act(() => {
      if (suggestion instanceof HTMLElement) suggestion.click();
    });
    await flush();
    expect(harness.slugAvailability).not.toHaveBeenCalled();

    fill(view.container, 'Никнейм', 'typed-author');
    clickButton(view.container, 'Дальше');
    clickButton(view.container, 'Дальше');
    await until(
      view.container,
      () => harness.slugAvailability.mock.calls.length === 1,
      'one availability request',
    );
    expect(view.container.textContent).toContain('Проверяем никнейм…');
    await act(async () => {
      resolveAvailability({ available: true });
    });
    await until(view.container, 'Создайте пароль');
    expect(harness.slugAvailability).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('stays on a taken nickname and refreshes three valid distinct suggestions', async () => {
    harness.slugAvailability.mockResolvedValueOnce({ available: false });
    const view = mount();
    await reachNickname(view.container);
    const initial = [
      ...view.container.querySelectorAll(
        'button[title="Заполнить поле никнейма"]',
      ),
    ].map((button) => button.textContent);
    expect(initial).toHaveLength(3);
    fill(view.container, 'Никнейм', 'taken-author');
    clickButton(view.container, 'Дальше');
    await until(view.container, '@taken-author недоступен');

    const refreshed = [
      ...view.container.querySelectorAll(
        'button[title="Заполнить поле никнейма"]',
      ),
    ].map((button) => button.textContent);
    expect(refreshed).toHaveLength(3);
    expect(new Set(refreshed).size).toBe(3);
    expect(refreshed.every((suggestion) => !initial.includes(suggestion))).toBe(
      true,
    );
    expect(
      (
        view.container.querySelector(
          '[aria-label="Никнейм"]',
        ) as HTMLInputElement
      ).value,
    ).toBe('taken-author');
    view.unmount();
  });

  it('preserves the nickname on a retryable availability error', async () => {
    harness.slugAvailability
      .mockRejectedValueOnce(
        new ApiClientError('network', { kind: 'network', status: 0 }),
      )
      .mockResolvedValueOnce({ available: true });
    const view = mount();
    await reachNickname(view.container);
    fill(view.container, 'Никнейм', 'retry-author');
    clickButton(view.container, 'Дальше');
    await until(
      view.container,
      'Не удалось проверить никнейм. Проверьте соединение и повторите.',
    );
    expect(
      (
        view.container.querySelector(
          '[aria-label="Никнейм"]',
        ) as HTMLInputElement
      ).value,
    ).toBe('retry-author');
    clickButton(view.container, 'Дальше');
    await until(view.container, 'Создайте пароль');
    expect(harness.slugAvailability).toHaveBeenCalledTimes(2);
    view.unmount();
  });

  it('ignores an availability reply after the session changes', async () => {
    let resolveAvailability: (value: { available: boolean }) => void = () =>
      undefined;
    harness.slugAvailability.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveAvailability = resolve;
        }),
    );
    const view = mount();
    await reachNickname(view.container);
    fill(view.container, 'Никнейм', 'session-author');
    clickButton(view.container, 'Дальше');
    await until(
      view.container,
      () => harness.slugAvailability.mock.calls.length === 1,
      'availability request',
    );
    await act(async () => {
      await replaceAuthenticatedSession(
        view.client,
        account('user-b', 'b@example.com', 'author-b'),
      );
    });
    await act(async () => {
      resolveAvailability({ available: true });
    });
    await flush();
    expect(view.container.textContent).not.toContain('Создайте пароль');
    expect(view.container.textContent).not.toContain(
      '@session-author доступен',
    );
    view.unmount();
  });

  it('ignores an availability reply after the route blurs', async () => {
    let resolveAvailability: (value: { available: boolean }) => void = () =>
      undefined;
    harness.slugAvailability.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveAvailability = resolve;
        }),
    );
    const view = mount();
    await reachNickname(view.container);
    fill(view.container, 'Никнейм', 'blurred-author');
    clickButton(view.container, 'Дальше');
    await until(
      view.container,
      () => harness.slugAvailability.mock.calls.length === 1,
      'availability request',
    );
    act(() => {
      harness.emitBlur();
    });
    await act(async () => {
      resolveAvailability({ available: true });
    });
    await flush();
    expect(view.container.textContent).not.toContain('Создайте пароль');
    expect(view.container.textContent).not.toContain(
      '@blurred-author доступен',
    );
    view.unmount();
  });

  it('returns a final slug conflict to nickname with password values preserved', async () => {
    harness.registerError = new ApiClientError('taken', {
      kind: 'conflict',
      status: 409,
      code: ApiErrorCode.CONFLICT,
      details: { reason: 'slug_taken' },
    });
    const view = mount();
    const initialSuggestions = await reachPassword(view.container);
    clickButton(view.container, 'Дальше');
    await until(view.container, 'Этот никнейм уже занят. Выберите другой.');
    expect(harness.registers).toBe(1);
    expect(harness.lastRegister).toMatchObject({ turnstileToken: 'widget-token' });
    expect(
      [
        ...view.container.querySelectorAll(
          'button[title="Заполнить поле никнейма"]',
        ),
      ].map((button) => button.textContent),
    ).toEqual(initialSuggestions);

    fill(view.container, 'Никнейм', 'replacement-author');
    clickButton(view.container, 'Дальше');
    await until(view.container, 'Создайте пароль');
    expect(
      (
        view.container.querySelector(
          '[aria-label="Введите пароль"]',
        ) as HTMLInputElement
      ).value,
    ).toBe('registration-password-123');
    expect(
      (
        view.container.querySelector(
          '[aria-label="Подтвердите пароль"]',
        ) as HTMLInputElement
      ).value,
    ).toBe('registration-password-123');
    expect(harness.registers).toBe(1);
    view.unmount();
  });

  it('does not register while legal documents are unavailable and lets the user retry', async () => {
    harness.failLegalOnce = true;
    const view = mount();
    await until(view.container, 'Юридические документы пока не опубликованы.');
    expect([...view.container.querySelectorAll('[role="checkbox"]')].every(
      (node) => node instanceof HTMLButtonElement && node.disabled,
    )).toBe(true);
    fill(view.container, 'Электронная почта', 'a@example.com');
    clickButton(view.container, 'Дальше');
    await flush();
    expect(harness.registers).toBe(0);
    clickButton(view.container, 'Повторить');
    await until(view.container, 'Редакция документов: portfolio-legal-2026-10-12');
    clickLegalLink(view.container, 'Пользовательское соглашение');
    await until(view.container, 'Договор для портфолио.');
    const dialog = view.container.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('Термин: Сервис');
    expect(dialog?.textContent).toContain('Значение: bidplace');
    const url = [...(dialog?.querySelectorAll('[role="link"]') ?? [])].find((node) =>
      node.textContent === 'https://bid.place/legal',
    );
    expect(url).toBeDefined();
    act(() => { if (url instanceof HTMLElement) url.click(); });
    expect(harness.openURL).toHaveBeenCalledWith('https://bid.place/legal');
    expect(harness.legalReads).toBe(2);
    expect(view.container.querySelector('[aria-label="Электронная почта"]')).toHaveProperty('value', 'a@example.com');
    view.unmount();
  });

  it('resets all confirmations if the server reports a stale legal version', async () => {
    harness.registerError = new ApiClientError('stale legal', {
      kind: 'conflict',
      status: 409,
      code: ApiErrorCode.CONFLICT,
      details: { reason: 'legal_version_stale' },
    });
    const view = mount();
    await reachPassword(view.container);
    clickButton(view.container, 'Дальше');
    await until(view.container, 'Редакция документов изменилась.');
    expect(harness.registers).toBe(1);
    expect(view.container.textContent).toContain('Введите вашу почту');
    const boxes = [...view.container.querySelectorAll('[role="checkbox"]')];
    expect(boxes).toHaveLength(4);
    expect(boxes.every((box) => box.getAttribute('aria-checked') !== 'true')).toBe(true);
    view.unmount();
  });

  it('does not navigate after the route loses focus during registration', async () => {
    harness.blurDuringRegister = true;
    const view = mount();
    await reachPassword(view.container);
    clickButton(view.container, 'Дальше');
    await flush();
    await flush();
    expect(harness.registers).toBe(1);
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
    expect(harness.replace).not.toHaveBeenCalled();
    expect(harness.registers).toBe(1);
    expect(view.container.textContent).toContain('Сессия изменилась. Повторите регистрацию.');
    clickButton(view.container, 'Дальше');
    await flush();
    expect(harness.registers).toBe(1);
    expect(harness.replace).not.toHaveBeenCalled();
    view.unmount();
  });

  it('locks password editing while registration is in flight, then installs the session', async () => {
    harness.holdRegister = true;
    const view = mount();
    await reachPassword(view.container);
    clickButton(view.container, 'Дальше');
    await until(view.container, () => harness.registers === 1, 'registration request');
    const confirmation = view.container.querySelector('[aria-label="Подтвердите пароль"]');
    expect(confirmation).toBeInstanceOf(HTMLInputElement);
    expect((confirmation as HTMLInputElement).disabled).toBe(true);
    await act(async () => { harness.releaseRegister?.(); });
    await until(view.container, () => harness.replace.mock.calls.length === 1, 'navigation');
    expect(harness.registers).toBe(1);
    view.unmount();
  });

  it('requires Turnstile proof for the atomic registration request', async () => {
    harness.proof = null;
    const view = mount();
    await reachPassword(view.container);
    clickButton(view.container, 'Дальше');
    await flush();
    expect(harness.registers).toBe(0);
    expect(view.container.textContent).toContain('Подтвердите, что вы не робот.');
    harness.proof = 'widget-token';
    view.unmount();
  });

  it('does not register when the shared check is unavailable', async () => {
    harness.availability = 'unavailable';
    const view = mount();
    await reachPassword(view.container);
    clickButton(view.container, 'Дальше');
    await flush();
    expect(harness.registers).toBe(0);
    expect(view.container.textContent).toContain('Проверка безопасности сейчас недоступна.');
    view.unmount();
  });

  it('registers once with all three document versions and separate 18+ acknowledgment', async () => {
    const view = mount();
    await reachPassword(view.container);
    clickButton(view.container, 'Дальше');
    clickButton(view.container, 'Дальше');
    await until(view.container, () => harness.replace.mock.calls.length > 0, 'navigation');
    expect(harness.registers).toBe(1);
    expect(harness.lastRegister).toMatchObject({
      legal: {
        agreement: { version: 'portfolio-legal-2026-10-12', confirmed: true },
        privacy: { version: 'portfolio-legal-2026-10-12', confirmed: true },
        dataConsent: { version: 'portfolio-legal-2026-10-12', confirmed: true },
        age18Confirmed: true,
      },
    });
    expect(harness.replace).toHaveBeenCalledTimes(1);
    view.unmount();
  });
});
