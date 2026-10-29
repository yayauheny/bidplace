import {
  AUTH_DISPOSABLE_EMAIL_COPY,
  AUTH_RATE_LIMIT_COPY,
  AUTH_TURNSTILE_FAILED_COPY,
  AUTH_TURNSTILE_REQUIRED_COPY,
  AUTH_TURNSTILE_UNAVAILABLE_COPY,
  INFRASTRUCTURE_ERROR_COPY,
} from '../../errors';
import { maskEmail } from './mask-email';
import type { VerificationReason } from './use-email-verification';

export type VerificationSendStatus = 'none' | 'accepted' | 'unknown' | 'rejected';

function address(email: string | null | undefined) {
  const trimmed = email?.trim();
  return trimmed ? maskEmail(trimmed) : 'этот адрес';
}

function unknownDeliveryCopy(email: string | null | undefined) {
  return `Исход отправки для ${address(email)} неизвестен. Повтор того же запроса не отправит ещё одно письмо. Код можно использовать, если он уже пришёл.`;
}

export function verificationStatusCopy(input: {
  email: string | null | undefined;
  sendStatus: VerificationSendStatus | null;
  verified: boolean;
  retrySendPending?: boolean;
}) {
  if (input.verified) return 'Адрес уже подтверждён.';
  if (input.sendStatus === 'unknown' || input.retrySendPending) return unknownDeliveryCopy(input.email);
  if (input.sendStatus === 'accepted') {
    return `Почтовый сервер принял письмо с кодом для ${address(input.email)}. Доставка в почтовый ящик не подтверждена.`;
  }
  if (input.sendStatus === 'rejected') return 'Запрос отклонён. Код не отправлялся.';
  return 'Код ещё не отправлен.';
}

export function verificationReasonCopy(
  reason: VerificationReason | null,
  remaining: { resend: number; pause: number; quota: number },
): string | null {
  if (!reason) return null;
  switch (reason.kind) {
    case 'accepted':
    case 'unknown':
      return null;
    case 'proof-failed':
      return 'Попробуйте ещё раз';
    case 'rejected':
      return 'Сервер не принял отправку.';
    case 'cooldown':
      return remaining.resend > 0 ? `Новый код можно запросить через ${remaining.resend} с.` : null;
    case 'quota':
      return remaining.quota > 0 ? `Лимит отправок исчерпан. Повторите через ${remaining.quota} с.` : null;
    case 'budget':
      return 'Лимит писем исчерпан. Отправка сейчас недоступна.';
    case 'paused':
      return remaining.pause > 0 ? `Проверка кода приостановлена. Повторите через ${remaining.pause} с.` : null;
    case 'rate-limit':
      return AUTH_RATE_LIMIT_COPY;
    case 'otp-invalid':
      return 'Код не подошёл. Измените его, затем повторите проверку.';
    case 'otp-expired':
      return 'Срок этого кода истёк.';
    case 'challenge':
      if (reason.outcome === 'failed') return AUTH_TURNSTILE_FAILED_COPY;
      if (reason.outcome === 'unavailable') return AUTH_TURNSTILE_UNAVAILABLE_COPY;
      return AUTH_TURNSTILE_REQUIRED_COPY;
    case 'network':
      return INFRASTRUCTURE_ERROR_COPY;
    case 'taken':
      return 'Этот адрес уже занят.';
    case 'disposable':
      return AUTH_DISPOSABLE_EMAIL_COPY;
    case 'validation':
      return 'Проверьте введённые данные.';
    case 'read-error':
      return 'Не удалось прочитать статус подтверждения.';
    case 'session':
      return 'Сессия изменилась. Подтверждение не перенесено.';
    case 'code-invalidated':
      return 'Прежний код больше не действует. Письмо не отправлено.';
    case 'unavailable':
      return AUTH_TURNSTILE_UNAVAILABLE_COPY;
    default:
      return null;
  }
}

export function verificationSendLabel(input: {
  sending: boolean;
  sendStatus: VerificationSendStatus | null;
  resendSeconds: number;
  quotaSeconds: number;
  retrySendPending?: boolean;
}) {
  if (input.sending) return 'Отправляем запрос…';
  const wait = Math.max(input.resendSeconds, input.quotaSeconds);
  if (wait > 0) return `Новый код через ${wait} сек`;
  if (!input.retrySendPending && (input.sendStatus === 'none' || input.sendStatus === null)) {
    return 'Отправить код';
  }
  return 'Отправить новый код';
}
