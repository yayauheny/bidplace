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
  Text: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  TextInput: ({
    accessibilityLabel,
    value,
    onChangeText,
  }: {
    accessibilityLabel?: string;
    value?: string;
    onChangeText?: (value: string) => void;
  }) =>
    createElement('input', {
      'aria-label': accessibilityLabel,
      value: value ?? '',
      onChange: (event: { target: { value: string } }) => onChangeText?.(event.target.value),
    }),
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

afterEach(() => {
  document.body.replaceChildren();
  harness.logout.mockReset();
  harness.refreshSession.mockReset();
  harness.replace.mockReset();
  harness.requestEmailVerification.mockReset();
  harness.verifyEmailVerification.mockReset();
});

describe('verify email body', () => {
  it('keeps completion and resend without a logout action', () => {
    const view = mount();
    expect(button(view.container, 'Завершить').textContent).toBe('Завершить');
    expect(button(view.container, 'Отправить код').textContent).toBe('Отправить код');
    expect(
      [...view.container.querySelectorAll('button')].some((item) => item.textContent === 'Выйти'),
    ).toBe(false);
    view.unmount();
  });
});
