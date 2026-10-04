import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthTokenService } from './auth-token.service';

describe('AuthTokenService', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('signs and verifies bearer payloads', () => {
    const service = new AuthTokenService('secret-key');

    const token = service.sign({
      sub: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      email: 'seller@example.com',
      role: 'user',
      sessionVersion: 0,
    });

    const payload = service.verify(token);

    expect(payload.sub).toBe('2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1');
    expect(payload.email).toBe('seller@example.com');
    expect(payload.role).toBe('user');
    expect(payload.sessionVersion).toBe(0);
  });

  it('rejects tampered tokens', () => {
    const service = new AuthTokenService('secret-key');

    const token = service.sign({
      sub: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      email: 'seller@example.com',
      role: 'user',
    });

    const [header, payload, signature] = token.split('.');

    expect(header).toBeDefined();
    expect(payload).toBeDefined();
    expect(signature).toBeDefined();

    const tamperedPayload = Buffer.from(
      JSON.stringify({
        sub: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        email: 'attacker@example.com',
        role: 'user',
        sessionVersion: 0,
        iat: 1,
        exp: 2_000_000_000,
      }),
      'utf8',
    ).toString('base64url');

    expect(() =>
      service.verify(`${header}.${tamperedPayload}.${signature}`),
    ).toThrow('Invalid token signature');
  });

  it('rejects expired tokens', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T12:00:00.000Z'));

    const service = new AuthTokenService('secret-key');

    const token = service.sign(
      {
        sub: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        email: 'seller@example.com',
        role: 'user',
        sessionVersion: 0,
      },
      1,
    );

    vi.setSystemTime(new Date('2026-07-13T12:00:02.000Z'));

    expect(() => service.verify(token)).toThrow('Token expired');
  });

  it.each([
    { name: 'a fourth segment', change: (token: string) => `${token}.extra` },
    { name: 'an empty fourth segment', change: (token: string) => `${token}.` },
    { name: 'signature padding', change: (token: string) => `${token}=` },
    { name: 'signature punctuation', change: (token: string) => `${token}!` },
  ])('rejects a signed JWT with $name', ({ change }) => {
    const service = new AuthTokenService('unit-format-key');
    const token = service.sign({
      sub: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      email: 'format@example.test',
      role: 'user',
      sessionVersion: 0,
    });

    expect(() => service.verify(change(token))).toThrow('Invalid token format');
  });

  it('rejects alternate signature pad bits even when decoded signature bytes match', () => {
    const service = new AuthTokenService('unit-format-key');
    const token = service.sign({
      sub: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      email: 'format@example.test',
      role: 'user',
      sessionVersion: 0,
    });
    const [header, payload, signature] = token.split('.') as [string, string, string];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const alternate = signature.slice(0, -1) + alphabet[alphabet.indexOf(signature.at(-1)!) ^ 1];
    expect(Buffer.from(alternate, 'base64url')).toEqual(Buffer.from(signature, 'base64url'));

    expect(() => service.verify(`${header}.${payload}.${alternate}`)).toThrow('Invalid token signature');
  });
});
