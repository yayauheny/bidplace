import { type ServerEnv, loadServerEnv } from '../core/config';
import {
  assertSingleEmailRecipient,
  buildSmtpTransportOptions,
} from '../core/email';
import { appendFile } from 'node:fs/promises';
import { createTransport, type Transporter } from 'nodemailer';

export abstract class PasswordResetTransport {
  abstract deliver(email: string, resetLink: string): Promise<void>;
}

export class LocalPasswordResetTransport extends PasswordResetTransport {
  async deliver(email: string, resetLink: string): Promise<void> {
    const env = loadServerEnv();

    if (env.NODE_ENV === 'production') {
      throw new Error('Local password reset transport cannot run in production');
    }

    if (env.TEST_EMAIL_FILE) {
      const token = new URL(resetLink).searchParams.get('token');
      await appendFile(
        env.TEST_EMAIL_FILE,
        `${JSON.stringify({ type: 'password_reset', email, token })}\n`,
      );
    }
  }
}

export class SmtpPasswordResetTransport extends PasswordResetTransport {
  constructor(
    private readonly env: ServerEnv,
    private readonly transport: Transporter,
  ) {
    super();
  }

  static create(env: ServerEnv): SmtpPasswordResetTransport {
    return new SmtpPasswordResetTransport(
      env,
      createTransport(buildSmtpTransportOptions(env)),
    );
  }

  async deliver(email: string, resetLink: string): Promise<void> {
    assertSingleEmailRecipient(email);
    await this.transport.sendMail({
      from: this.env.SMTP_FROM,
      to: email,
      subject: 'bidplace password reset',
      text: `Reset your bidplace password using this link: ${resetLink}`,
    });
  }
}

export function buildPasswordResetLink(baseUrl: string, token: string): string {
  const url = new URL('/reset-password', baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}
