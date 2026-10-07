export const EMAIL_VERIFICATION_RESEND_MS = 60_000;

export function resendRemainingSeconds(deadline: number | null, now: number) {
  if (deadline === null) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function confirmedResendDeadline(now: number) {
  return now + EMAIL_VERIFICATION_RESEND_MS;
}
