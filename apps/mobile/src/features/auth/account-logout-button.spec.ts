/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ApiClientError } from '@bidplace/api-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { flush } from '../../testing/dom';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const harness = vi.hoisted(() => ({
  isAuthenticated: true,
  logout: vi.fn<() => Promise<void>>(),
  replace: vi.fn(),
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('../../components/ui', () => ({
  SecondaryButton: ({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        disabled: Boolean(disabled),
        onClick: () => {
          if (!disabled) onPress();
        },
      },
      label,
    ),
}));

vi.mock('../../providers/auth-provider', () => ({
  useAuth: () => ({
    isAuthenticated: harness.isAuthenticated,
    logout: harness.logout,
    user: harness.isAuthenticated
      ? { email: 'author@example.com' }
      : null,
  }),
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({ replace: harness.replace }),
}));

import { AccountLogoutButton } from './AccountLogoutButton';

function mount(node: ReactNode) {
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(node);
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

function click(container: ParentNode, label: string) {
  const target = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === label,
  );
  if (!target) throw new Error(`Missing button ${label}`);
  act(() => {
    target.click();
  });
}

afterEach(() => {
  document.body.replaceChildren();
  harness.isAuthenticated = true;
  harness.logout.mockReset();
  harness.replace.mockReset();
  vi.restoreAllMocks();
});

describe('AccountLogoutButton', () => {
  it('renders nothing for a guest', () => {
    harness.isAuthenticated = false;
    const view = mount(createElement(AccountLogoutButton));
    expect(view.container.querySelector('button')).toBeNull();
    view.unmount();
  });

  it('calls logout once and replaces home after success', async () => {
    harness.logout.mockResolvedValue(undefined);
    const view = mount(createElement(AccountLogoutButton));
    click(view.container, 'Выйти');
    await flush();
    expect(harness.logout).toHaveBeenCalledTimes(1);
    expect(harness.replace).toHaveBeenCalledWith('/');
    view.unmount();
  });

  it('ignores a second press while logout is pending', async () => {
    let finish: () => void = () => undefined;
    harness.logout.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const view = mount(createElement(AccountLogoutButton));
    click(view.container, 'Выйти');
    click(view.container, 'Выйти');
    expect(harness.logout).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish();
    });
    await flush();
    expect(harness.logout).toHaveBeenCalledTimes(1);
    expect(harness.replace).toHaveBeenCalledTimes(1);
    expect(harness.replace).toHaveBeenCalledWith('/');
    view.unmount();
  });

  it('replaces home after a rejected server logout without an unhandled rejection', async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => {
      unhandled.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    harness.logout.mockRejectedValue(
      new ApiClientError('offline', { kind: 'network', status: 0 }),
    );
    const view = mount(createElement(AccountLogoutButton));
    click(view.container, 'Выйти');
    await flush();
    await flush();
    expect(harness.logout).toHaveBeenCalledTimes(1);
    expect(harness.replace).toHaveBeenCalledWith('/');
    expect(info).toHaveBeenCalledWith(
      '[infrastructure-error]',
      expect.objectContaining({ surface: 'account-logout', kind: 'network' }),
    );
    expect(unhandled).toEqual([]);
    process.off('unhandledRejection', onUnhandled);
    view.unmount();
  });
});
