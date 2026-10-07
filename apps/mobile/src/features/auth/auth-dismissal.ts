import type { SafeRedirect } from './auth-redirect';

const AUTH_ROUTES = new Set([
  'login',
  'register',
  'forgot-password',
  'reset-password',
  'verify-email',
]);

const PUBLIC_PREFIXES = ['/works', '/authors', '/search', '/product'];

export type AuthDismissal = 'allow' | 'confirm' | 'keep';

type NavigationAction = {
  type?: string;
  payload?: {
    name?: string;
    params?: { screen?: string };
  };
};

export function authNavigationTarget(action: NavigationAction | undefined) {
  const screen = action?.payload?.params?.screen;
  if (typeof screen === 'string') return screen;
  const name = action?.payload?.name;
  if (typeof name === 'string' && !name.startsWith('(')) return name;
  return undefined;
}

export function authNavigationDismissal(input: {
  dirty: boolean;
  busy: boolean;
  targetRoute: string | undefined;
}): AuthDismissal {
  if (input.targetRoute && AUTH_ROUTES.has(input.targetRoute)) return 'allow';
  if (input.busy) return 'keep';
  if (!input.dirty) return 'allow';
  return 'confirm';
}

export function authLeaveDestination(redirectTo: SafeRedirect): SafeRedirect {
  const path = redirectTo.split(/[?#]/)[0] || '/';
  if (path === '/') return '/';
  if (PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return redirectTo;
  }
  return '/';
}

export function registerSubmission<T extends { confirmPassword: string }>(values: T) {
  const { confirmPassword, ...request } = values;
  void confirmPassword;
  return request;
}
