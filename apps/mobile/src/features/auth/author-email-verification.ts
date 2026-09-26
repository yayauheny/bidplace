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

export function emailVerificationRequestErrorMessage(
  status: number | null,
  fallback: string,
): string {
  return status === 409
    ? 'Код уже отправлен. Попробуйте запросить новый немного позже.'
    : fallback;
}

export async function verifyEmailAndRefresh(input: {
  code: string;
  verify: (code: string) => Promise<void>;
  refreshSession: () => Promise<{ emailVerifiedAt: string | null } | null>;
}): Promise<'invalid-code' | 'not-verified' | 'verified'> {
  if (!isEmailVerificationCode(input.code)) return 'invalid-code';

  await input.verify(input.code);
  const user = await input.refreshSession();
  return user?.emailVerifiedAt ? 'verified' : 'not-verified';
}

export function verificationDestination(
  verified: boolean,
  redirectTo: SafeRedirect,
): SafeRedirect | null {
  return verified ? redirectTo : null;
}
