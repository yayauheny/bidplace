import { MailDeliveryDisabledError } from '../core/mail/mail-transport';

const RECIPIENT_REJECTED = 'Mail recipient must be a single email address';

/**
 * Nodemailer uses `command: 'CONN'` both for a failed handshake and for a
 * disconnect after DATA. That field alone does not prove the server refused
 * the message. Only an SMTP response code in 400–599 is a guaranteed reject.
 * Timeouts, connection loss, and every other ambiguity stay `unknown`.
 */
export function classifyMailFailure(error: unknown): 'rejected' | 'unknown' {
  if (
    error instanceof MailDeliveryDisabledError ||
    (error instanceof Error && error.message === RECIPIENT_REJECTED)
  ) {
    return 'rejected';
  }

  if (typeof error !== 'object' || error === null || !('responseCode' in error)) {
    return 'unknown';
  }

  const responseCode = Number((error as { responseCode?: unknown }).responseCode);
  if (responseCode >= 400 && responseCode < 600) return 'rejected';
  return 'unknown';
}
