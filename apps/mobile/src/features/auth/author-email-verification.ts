import type { SafeRedirect } from './auth-redirect';

export type ProtectedRouteAccess = 'allow' | 'login' | 'verify-email';

export function resolveProtectedRouteAccess(input: {
  isAuthenticated: boolean;
  emailVerifiedAt: string | null | undefined;
  requireVerifiedEmail: boolean;
}): ProtectedRouteAccess {
  if (!input.isAuthenticated) return 'login';
  if (input.requireVerifiedEmail && !input.emailVerifiedAt) {
    return 'verify-email';
  }
  return 'allow';
}

export function normalizeEmailVerificationCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}

export function isEmailVerificationCode(value: string): boolean {
  return /^\d{6}$/.test(value);
}

export function verificationDestination(
  verified: boolean,
  redirectTo: SafeRedirect,
): SafeRedirect | null {
  return verified ? redirectTo : null;
}
