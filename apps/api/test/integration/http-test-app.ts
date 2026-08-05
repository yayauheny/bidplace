import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';

import { configureHttpApp } from '../../src/bootstrap';
import { loadServerEnv, resolveCorsOrigin } from '../../src/core/config';

export type HttpTestApp = {
  app: INestApplication;
  baseUrl: string;
  close: () => Promise<void>;
};

export async function createHttpTestApp(
  databaseUrl: string,
  corsOrigin = 'http://localhost:8081',
): Promise<HttpTestApp> {
  process.env.NODE_ENV = 'test';
  process.env.APP_ENV = 'local';
  process.env.DATABASE_URL = databaseUrl;
  process.env.CORS_ORIGIN = corsOrigin;
  process.env.TRUST_PROXY = 'true';
  process.env.JWT_SECRET = 'wave-3-http-test-secret';
  process.env.TEST_EMAIL_BYPASS = 'false';

  const { AppModule } = await import('../../src/app.module');
  const serverEnv = loadServerEnv();
  const runtimeEnv = {
    ...serverEnv,
    CORS_ORIGIN: resolveCorsOrigin(serverEnv),
  };
  const app = await NestFactory.create(AppModule, { logger: false });

  configureHttpApp(app, runtimeEnv);
  await app.listen(0, '127.0.0.1');

  return {
    app,
    baseUrl: await app.getUrl(),
    close: () => app.close(),
  };
}

export type HttpRequestInit = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown>;
};

export class HttpTestClient {
  private readonly cookies = new Map<string, string>();

  constructor(
    private readonly baseUrl: string,
    private readonly origin?: string,
    private readonly forwardedFor?: string,
  ) {}

  async request(path: string, init: HttpRequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    const cookie = this.cookieHeader();

    if (cookie) headers.set('cookie', cookie);
    if (this.origin) headers.set('origin', this.origin);
    if (this.forwardedFor) headers.set('x-forwarded-for', this.forwardedFor);

    let body = init.body;
    if (
      body &&
      typeof body === 'object' &&
      !(body instanceof ArrayBuffer) &&
      !(body instanceof Blob) &&
      !(body instanceof FormData) &&
      !(body instanceof URLSearchParams)
    ) {
      headers.set('content-type', 'application/json');
      body = JSON.stringify(body);
    }

    const response = await fetch(new URL(`/api${path}`, this.baseUrl), {
      ...init,
      headers,
      body: body as BodyInit | null | undefined,
    });

    this.storeCookies(response);
    return response;
  }

  get(path: string, init?: HttpRequestInit): Promise<Response> {
    return this.request(path, { ...init, method: 'GET' });
  }

  post(path: string, body?: HttpRequestInit['body']): Promise<Response> {
    return this.request(path, { method: 'POST', body });
  }

  patch(path: string, body?: HttpRequestInit['body']): Promise<Response> {
    return this.request(path, { method: 'PATCH', body });
  }

  delete(path: string): Promise<Response> {
    return this.request(path, { method: 'DELETE' });
  }

  private cookieHeader(): string {
    return [...this.cookies.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  private storeCookies(response: Response): void {
    for (const setCookie of response.headers.getSetCookie()) {
      const [pair, ...attributes] = setCookie.split(';');
      const separator = pair.indexOf('=');
      if (separator < 1) continue;

      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      const maxAge = attributes.find((attribute) =>
        attribute.trim().toLowerCase().startsWith('max-age='),
      );

      if (maxAge?.trim().toLowerCase() === 'max-age=0' || value === '') {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }
}

export async function responseJson(response: Response): Promise<unknown> {
  return response.json();
}
