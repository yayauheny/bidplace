import {
  authTokenPayloadSchema,
  type AuthTokenPayload,
} from '@bidplace/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

import { AUTH_TOKEN_TTL_SECONDS, AUTH_TOKEN_SECRET } from './auth.constants';

type AuthTokenClaims = Pick<AuthTokenPayload, 'sub' | 'email' | 'role'>;

const tokenHeader = {
  alg: 'HS256',
  typ: 'JWT',
} as const;

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signContent(content: string, secret: string): string {
  return createHmac('sha256', secret).update(content).digest('base64url');
}

@Injectable()
export class AuthTokenService {
  constructor(@Inject(AUTH_TOKEN_SECRET) private readonly secret: string) {}

  sign(claims: AuthTokenClaims, ttlSeconds = AUTH_TOKEN_TTL_SECONDS): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: AuthTokenPayload = {
      ...claims,
      iat: now,
      exp: now + ttlSeconds,
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(tokenHeader));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = signContent(`${encodedHeader}.${encodedPayload}`, this.secret);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verify(token: string): AuthTokenPayload {
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new Error('Invalid token format');
    }

    const expectedSignature = signContent(
      `${encodedHeader}.${encodedPayload}`,
      this.secret,
    );

    const expectedBuffer = Buffer.from(expectedSignature, 'base64url');
    const providedBuffer = Buffer.from(signature, 'base64url');

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      throw new Error('Invalid token signature');
    }

    const header = JSON.parse(base64UrlDecode(encodedHeader)) as {
      alg?: string;
      typ?: string;
    };

    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      throw new Error('Invalid token header');
    }

    const payload = authTokenPayloadSchema.parse(
      JSON.parse(base64UrlDecode(encodedPayload)),
    );

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  }
}
