import { describe, expect, it } from 'vitest';

import {
  assertSingleEmailRecipient,
  buildSmtpTransportOptions,
} from './smtp-transport';

describe('smtp transport', () => {
  it('requires TLS for production SMTP relays and rejects partial auth', () => {
    expect(
      buildSmtpTransportOptions({
        NODE_ENV: 'production',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: 587,
        SMTP_SECURE: false,
        SMTP_AUTH_MODE: 'none',
        SMTP_FROM: 'no-reply@example.com',
        SERVICE_RULES_OWNER: 'Bidplace',
        SERVICE_RULES_CONTACT: 'support@example.com',
        SERVICE_RULES_TEXT: 'Rules text',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/bidplace',
        JWT_SECRET: 'secret',
      } as never).requireTLS,
    ).toBe(true);

    expect(() =>
      buildSmtpTransportOptions({
        NODE_ENV: 'production',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: 465,
        SMTP_SECURE: true,
        SMTP_AUTH_MODE: 'login',
        SMTP_USERNAME: 'user',
        SMTP_FROM: 'no-reply@example.com',
        SERVICE_RULES_OWNER: 'Bidplace',
        SERVICE_RULES_CONTACT: 'support@example.com',
        SERVICE_RULES_TEXT: 'Rules text',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/bidplace',
        JWT_SECRET: 'secret',
      } as never),
    ).toThrow('SMTP_USERNAME and SMTP_PASSWORD must be configured together');
  });

  it('builds implicit TLS login for Cloudflare Email Service SMTP', () => {
    expect(
      buildSmtpTransportOptions({
        NODE_ENV: 'production',
        SMTP_HOST: 'smtp.mx.cloudflare.net',
        SMTP_PORT: 465,
        SMTP_SECURE: true,
        SMTP_AUTH_MODE: 'login',
        SMTP_USERNAME: 'api_token',
        SMTP_PASSWORD: 'token-placeholder',
        SMTP_FROM: 'noreply@example.com',
      } as never),
    ).toMatchObject({
      host: 'smtp.mx.cloudflare.net',
      port: 465,
      secure: true,
      requireTLS: false,
      auth: { user: 'api_token', pass: 'token-placeholder' },
    });
  });

  it('omits SMTP auth for an unauthenticated relay', () => {
    expect(
      buildSmtpTransportOptions({
        NODE_ENV: 'development',
        SMTP_AUTH_MODE: 'none',
        SMTP_HOST: 'mailpit',
        SMTP_PORT: 1025,
        SMTP_SECURE: false,
        SMTP_FROM: 'no-reply@example.com',
      } as never),
    ).not.toHaveProperty('auth');
  });

  it('rejects nested or group recipient addresses', () => {
    expect(() => assertSingleEmailRecipient('user@example.com')).not.toThrow();
    expect(() =>
      assertSingleEmailRecipient('group <user@example.com>'),
    ).toThrow('Mail recipient must be a single email address');
  });
});
