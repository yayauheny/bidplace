import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { loadServerEnv } from './core/config';
import { RealtimeSocketIoAdapter } from './realtime/realtime.adapter';

async function bootstrap() {
  const serverEnv = loadServerEnv();
  const runtimeEnv = {
    ...serverEnv,
    CORS_ORIGIN:
      serverEnv.CORS_ORIGIN ??
      (serverEnv.APP_ENV === 'local' ? 'http://localhost:8081' : undefined),
  };
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useWebSocketAdapter(new RealtimeSocketIoAdapter(app, runtimeEnv));

  if (runtimeEnv.TRUST_PROXY) {
    app.getHttpAdapter().getInstance().set('trust proxy', true);
  }

  if (runtimeEnv.CORS_ORIGIN) {
    app.enableCors({
      origin: runtimeEnv.CORS_ORIGIN,
      credentials: true,
    });
  }

  await app.listen(runtimeEnv.API_PORT);
}

void bootstrap();
