import { maskEmail } from './mask-email';

export function verificationStatusCopy(input: {
  email: string | null | undefined;
  sendAccepted: boolean;
}) {
  if (!input.sendAccepted) return 'Код ещё не отправлен.';
  const address = input.email?.trim() ? maskEmail(input.email.trim()) : 'ваш email';
  return `Код отправлен на ${address}`;
}
