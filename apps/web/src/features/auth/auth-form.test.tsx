import { createElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginForm, RegisterForm } from './auth-form';

const replaceMock = vi.fn();
const loginMock = vi.fn();
const registerMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock('../../providers/auth-provider', () => ({
  useAuth: () => ({
    ready: true,
    isAuthenticated: false,
    user: null,
    login: loginMock,
    register: registerMock,
    logout: vi.fn(),
  }),
}));

describe('auth forms', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    loginMock.mockReset();
    registerMock.mockReset();
  });

  it('submits login credentials and redirects', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({
      accessToken: 'token',
      user: { id: '1', email: 'user@example.com', displayName: 'User', role: 'buyer', status: 'active' },
    });

    render(createElement(LoginForm, { redirectTo: '/seller' }));

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'secret123',
      });
      expect(replaceMock).toHaveBeenCalledWith('/seller');
    });
  });

  it('submits registration data and redirects', async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValue({
      accessToken: 'token',
      user: { id: '2', email: 'new@example.com', displayName: 'New User', role: 'buyer', status: 'active' },
    });

    render(createElement(RegisterForm, { redirectTo: '/welcome' }));

    await user.type(screen.getByLabelText('Имя'), 'New User');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Телефон'), '+375291112233');
    await user.type(screen.getByLabelText('Пароль'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        displayName: 'New User',
        email: 'new@example.com',
        phone: '+375291112233',
        password: 'secret123',
      });
      expect(replaceMock).toHaveBeenCalledWith('/welcome');
    });
  });
});
