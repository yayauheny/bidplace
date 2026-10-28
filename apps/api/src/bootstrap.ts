import type { INestApplication } from '@nestjs/common';
import { SessionService } from './auth/session.service';
import { CsrfMiddleware } from './auth/csrf.middleware';

import type { ServerEnv } from './core/config';

export function configureHttpApp(
  app: INestApplication,
  runtimeEnv: ServerEnv,
): void {
  app.setGlobalPrefix('api');

  if (runtimeEnv.TRUST_PROXY) {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  app.use(app.get(SessionService).middleware);
  const csrf = new CsrfMiddleware(runtimeEnv);
  app.use(csrf.use.bind(csrf));

  if (runtimeEnv.CORS_ORIGIN) {
    app.enableCors({
      origin: runtimeEnv.CORS_ORIGIN,
      credentials: true,
      exposedHeaders: ['X-Request-Id'],
    });
  }
}
