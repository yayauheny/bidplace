export const PERSONAL_MAIL_LIMIT = 10;
export const PERSONAL_MAIL_WINDOW_MS = 24 * 60 * 60 * 1000;
export const MAIL_MONTH_WINDOW_MS = 31 * 24 * 60 * 60 * 1000;
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_PAUSE_AFTER = 5;
export const OTP_PAUSE_MS = 5 * 60 * 1000;
export const LOGIN_TURNSTILE_AFTER = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_PAIR_PAUSE_AFTER = 10;
export const LOGIN_PAUSE_MS = 5 * 60 * 1000;
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export const MAIL_PURPOSES = [
  'email_verification_send',
  'password_reset_send',
  'email_login_send',
] as const;

/** Reservations that spend quota, including an unfinished or unknown send. */
export const MAIL_SPEND_STATUSES = ['reserved', 'accepted', 'unknown'] as const;

export function cooldownAfterSends(priorSends: number): number {
  if (priorSends <= 0) return 0;
  if (priorSends === 1) return 60_000;
  if (priorSends === 2) return 120_000;
  return 300_000;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Failures strictly younger than 15 minutes, capped at the challenge threshold. */
export function recentLoginFailures(
  timestamps: readonly Date[],
  now: Date,
): Date[] {
  const oldestKept = now.getTime() - LOGIN_WINDOW_MS;
  return timestamps
    .filter((timestamp) => timestamp.getTime() > oldestKept)
    .sort((left, right) => left.getTime() - right.getTime())
    .slice(-LOGIN_TURNSTILE_AFTER);
}

/** Latest moment an exhausted account or address scope becomes available again. */
export function latestExhaustedQuotaReset(
  scopes: ReadonlyArray<readonly Date[]>,
): Date | null {
  let latest: number | null = null;
  for (const scope of scopes) {
    if (scope.length < PERSONAL_MAIL_LIMIT) continue;
    const boundary = [...scope].sort(
      (left, right) => left.getTime() - right.getTime(),
    )[scope.length - PERSONAL_MAIL_LIMIT];
    if (!boundary) continue;
    const resetsAt = boundary.getTime() + PERSONAL_MAIL_WINDOW_MS;
    if (latest === null || resetsAt > latest) latest = resetsAt;
  }
  return latest === null ? null : new Date(latest);
}
