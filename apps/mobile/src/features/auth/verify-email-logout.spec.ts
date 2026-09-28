/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const harness = vi.hoisted(() => ({
  logout: vi.fn<() => Promise<void>>(),
  refreshSession: vi.fn(),
  replace: vi.fn(),
  requestEmailVerification: vi.fn(),
  verifyEmailVerification: vi.fn(),
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({ replace: harness.replace }),
}));

vi.mock('../../providers/auth-provider', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    logout: harness.logout,
    refreshSession: harness.refreshSession,
    user: {
      email: 'author@example.com',
      emailVerifiedAt: null,
      role: 'user',
    },
  }),
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    auth: {
      requestEmailVerification: harness.requestEmailVerification,
      verifyEmailVerification: harness.verifyEmailVerification,
    },
  }),
}));

vi.mock('../../components/ui', () => ({
  AppText: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
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
  PrimaryButton: ({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        disabled: Boolean(disabled),
        onClick: () => {
          if (!disabled) onPress?.();
        },
      },
      label,
    ),
  SecondaryButton: ({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        disabled: Boolean(disabled),
        onClick: () => {
          if (!disabled) onPress?.();
        },
      },
      label,
    ),
}));

import { VerifyEmailForm } from './verify-email-form';

function mount() {
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(createElement(VerifyEmailForm, { redirectTo: '/profile', autoRequest: false }));
  });
  return {
    container,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

function button(container: ParentNode, label: string) {
  const target = [...container.querySelectorAll('button')].find((item) => item.textContent === label);
  if (!target) throw new Error(`Missing button ${label}`);
  return target;
}

function click(container: ParentNode, label: string) {
  act(() => {
    button(container, label).click();
  });
}

function setCode(container: ParentNode, value: string) {
  const input = container.querySelector('[aria-label="Код из письма"]');
  if (!(input instanceof HTMLInputElement)) throw new Error('Missing code field');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

afterEach(() => {
  document.body.replaceChildren();
  harness.logout.mockReset();
  harness.refreshSession.mockReset();
  harness.replace.mockReset();
  harness.requestEmailVerification.mockReset();
  harness.verifyEmailVerification.mockReset();
});

describe('verify email logout boundary', () => {
  it('does not call logout while email verification is pending', async () => {
    harness.verifyEmailVerification.mockImplementation(() => new Promise(() => undefined));
    const view = mount();
    setCode(view.container, '123456');
    click(view.container, 'Подтвердить');
    await flush();
    expect(button(view.container, 'Выйти').disabled).toBe(true);
    click(view.container, 'Выйти');
    expect(harness.logout).not.toHaveBeenCalled();
    view.unmount();
  });

  it('disables verify and request-code while logout is pending', async () => {
    harness.logout.mockImplementation(() => new Promise(() => undefined));
    const view = mount();
    click(view.container, 'Выйти');
    await flush();
    expect(button(view.container, 'Подтвердить').disabled).toBe(true);
    expect(button(view.container, 'Отправить код').disabled).toBe(true);
    view.unmount();
  });

  it('does not refresh the session from a new verify after logout has started', async () => {
    harness.logout.mockImplementation(() => new Promise(() => undefined));
    harness.verifyEmailVerification.mockResolvedValue(undefined);
    harness.refreshSession.mockResolvedValue({ emailVerifiedAt: '2026-09-27T00:00:00.000Z' });
    const view = mount();
    setCode(view.container, '123456');
    click(view.container, 'Выйти');
    click(view.container, 'Подтвердить');
    click(view.container, 'Отправить код');
    await flush();
    expect(harness.logout).toHaveBeenCalledTimes(1);
    expect(harness.verifyEmailVerification).not.toHaveBeenCalled();
    expect(harness.requestEmailVerification).not.toHaveBeenCalled();
    expect(harness.refreshSession).not.toHaveBeenCalled();
    view.unmount();
  });
});
