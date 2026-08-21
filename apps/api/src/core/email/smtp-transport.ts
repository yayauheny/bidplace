import { type ServerEnv } from '../config';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

const SINGLE_EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export function assertSingleEmailRecipient(email: string): void {
  const trimmed = email.trim();

  if (!SINGLE_EMAIL_PATTERN.test(trimmed)) {
    throw new Error('Mail recipient must be a single email address');
  }
}

export function buildSmtpTransportOptions(env: ServerEnv): SMTPTransport.Options {
  const hasUsername = env.SMTP_USERNAME !== undefined;
  const hasPassword = env.SMTP_PASSWORD !== undefined;

  if (env.SMTP_AUTH_MODE === 'login' && (!hasUsername || !hasPassword)) {
    throw new Error('SMTP_USERNAME and SMTP_PASSWORD must be configured together');
  }

  if (env.SMTP_AUTH_MODE !== 'login' && (hasUsername || hasPassword)) {
    throw new Error('SMTP_USERNAME and SMTP_PASSWORD require SMTP_AUTH_MODE=login');
  }

  const auth =
    env.SMTP_AUTH_MODE === 'login' && hasUsername && hasPassword
      ? {
          user: env.SMTP_USERNAME,
          pass: env.SMTP_PASSWORD,
        }
      : undefined;

  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE ?? false,
    requireTLS: env.SMTP_SECURE === false,
    ...(auth ? { auth } : {}),
    connectionTimeout: 10_000,
    socketTimeout: 10_000,
  };
}
