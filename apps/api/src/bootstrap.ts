import type { INestApplication } from '@nestjs/common';

import type { ServerEnv } from './core/config';

export function configureHttpApp(
  app: INestApplication,
  runtimeEnv: Pick<ServerEnv, 'CORS_ORIGIN' | 'TRUST_PROXY'>,
): void {
  app.setGlobalPrefix('api');

  if (runtimeEnv.TRUST_PROXY) {
    app.getHttpAdapter().getInstance().set('trust proxy', true);
  }

  if (runtimeEnv.CORS_ORIGIN) {
    app.enableCors({
      origin: runtimeEnv.CORS_ORIGIN,
      credentials: true,
      exposedHeaders: ['X-Request-Id'],
    });
  }
}
