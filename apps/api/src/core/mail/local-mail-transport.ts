import { appendFile } from 'node:fs/promises';

import { loadServerEnv, requiresProductionSecurity } from '../config';
import type { MailMessage } from './mail-message';
import { MailTransport } from './mail-transport';

function extractOtpCode(text: string): string | undefined {
  const match = text.match(/verification code is (\d{6})/);
  return match?.[1];
}

function extractPasswordResetToken(text: string): string | undefined {
  try {
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (!urlMatch) {
      return undefined;
    }

    return new URL(urlMatch[0]).searchParams.get('token') ?? undefined;
  } catch {
    return undefined;
  }
}

export class LocalMailTransport extends MailTransport {
  async send(message: MailMessage): Promise<void> {
    const env = loadServerEnv();

    if (requiresProductionSecurity(env)) {
      throw new Error('Local mail transport cannot run in production');
    }

    if (!env.TEST_EMAIL_FILE) {
      return;
    }

    const payload: Record<string, string> = {
      to: message.to,
      subject: message.subject,
      text: message.text,
    };

    if (message.subject.includes('verification')) {
      const code = extractOtpCode(message.text);
      if (code) {
        payload.email = message.to;
        payload.code = code;
      }
    }

    if (message.subject.includes('password reset')) {
      const token = extractPasswordResetToken(message.text);
      payload.type = 'password_reset';
      payload.email = message.to;
      if (token) {
        payload.token = token;
      }
    }

    await appendFile(env.TEST_EMAIL_FILE, `${JSON.stringify(payload)}\n`);
  }
}
