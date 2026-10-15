import type { RegisterRequest } from '@bidplace/contracts';

import { getSafeRedirect, type SafeRedirect } from './auth-redirect';

const AUTH_ROUTES = new Set([
  'login',
  'register',
  'forgot-password',
  'reset-password',
  'verify-email',
]);

const PUBLIC_PREFIXES = ['/works', '/authors', '/search', '/product', '/seller'];

export type AuthDismissal = 'allow' | 'confirm' | 'keep';

type RouteNode = {
  name?: string;
  path?: string;
  params?: { screen?: string };
  state?: NavigationNode;
};

type NavigationNode = {
  index?: number;
  routes?: RouteNode[];
};

type NavigationAction = {
  type?: string;
  payload?: {
    name?: string;
    params?: { screen?: string };
    index?: number;
    routes?: RouteNode[];
  };
};

export function authRouteFromLocation(path: string) {
  const pathname = (path.split(/[?#]/)[0] || '/').replace(/\/+$/, '') || '/';
  const name = pathname.slice(1);
  return AUTH_ROUTES.has(name) ? name : undefined;
}

function focusedRouteName(state: NavigationNode | undefined): string | undefined {
  if (!state || !Array.isArray(state.routes) || typeof state.index !== 'number') return undefined;
  const route = state.routes[state.index];
  if (!route) return undefined;
  const nested = focusedRouteName(route.state);
  if (nested) return nested;
  if (typeof route.path === 'string') {
    const fromPath = authRouteFromLocation(route.path.startsWith('/') ? route.path : `/${route.path}`);
    if (fromPath) return fromPath;
  }
  if (typeof route.params?.screen === 'string') return route.params.screen;
  if (typeof route.name === 'string' && !route.name.startsWith('(')) return route.name;
  return undefined;
}

export function authNavigationTarget(action: NavigationAction | undefined) {
  const payload = action?.payload;
  if (payload && Array.isArray(payload.routes)) return focusedRouteName(payload);
  const screen = payload?.params?.screen;
  if (typeof screen === 'string') return screen;
  const name = payload?.name;
  if (typeof name === 'string' && !name.startsWith('(')) return name;
  return undefined;
}

export function authNavigationDismissal(input: {
  dirty: boolean;
  busy: boolean;
  protectEnteredData: boolean;
  targetRoute: string | undefined;
  released?: boolean;
}): AuthDismissal {
  if (input.released) return 'allow';
  if (input.targetRoute && AUTH_ROUTES.has(input.targetRoute)) return 'allow';
  if (input.busy) return 'keep';
  if (input.protectEnteredData && input.dirty) return 'confirm';
  return 'allow';
}

export function authLeaveCommit(input: {
  hasNavigationAction: boolean;
}): 'dispatch' | 'replace' {
  return input.hasNavigationAction ? 'dispatch' : 'replace';
}

export function authBrowserLeaveTarget(path: string): SafeRedirect {
  return getSafeRedirect(path);
}

export function authLeaveDestination(redirectTo: SafeRedirect): SafeRedirect {
  const path = redirectTo.split(/[?#]/)[0] || '/';
  if (path === '/') return '/';
  if (PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return redirectTo;
  }
  return '/';
}

export function registerSubmission(values: {
  email: string;
  password: string;
  slug: string;
  phone?: string | null;
  confirmPassword: string;
  agreementAccepted: boolean;
  privacyAcknowledged: boolean;
  dataConsentGiven: boolean;
  age18Confirmed: boolean;
}, version: string): Omit<RegisterRequest, 'turnstileToken'> {
  if (!values.agreementAccepted || !values.privacyAcknowledged || !values.dataConsentGiven || !values.age18Confirmed || !version) {
    throw new Error('Registration requires all current legal confirmations');
  }
  const request: Omit<RegisterRequest, 'turnstileToken'> = {
    email: values.email,
    password: values.password,
    slug: values.slug,
    legal: {
      agreement: { version, confirmed: true },
      privacy: { version, confirmed: true },
      dataConsent: { version, confirmed: true },
      age18Confirmed: true,
    },
  };
  if (values.phone !== undefined) request.phone = values.phone;
  return request;
}
