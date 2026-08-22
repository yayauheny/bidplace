import { describe, expect, it } from 'vitest';

import { type ServerEnv } from '../config';
import { buildSmtpTransportOptions } from '../email';
import { SmtpMailTransport } from './smtp-mail-transport';

describe('SmtpMailTransport', () => {
  it('requires TLS for production SMTP relays and rejects partial auth', () => {
    expect(
      buildSmtpTransportOptions({
        NODE_ENV: 'production',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: 587,
        SMTP_SECURE: false,
        SMTP_AUTH_MODE: 'none',
        SMTP_FROM: 'no-reply@example.com',
      } as ServerEnv).requireTLS,
    ).toBe(true);

    expect(() =>
      SmtpMailTransport.create({
        NODE_ENV: 'production',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: 465,
        SMTP_SECURE: true,
        SMTP_AUTH_MODE: 'login',
        SMTP_USERNAME: 'user',
        SMTP_FROM: 'no-reply@example.com',
      } as ServerEnv),
    ).toThrow('SMTP_USERNAME and SMTP_PASSWORD must be configured together');
  });
});
