import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { loadServerEnv } from './core/config';
import { RealtimeSocketIoAdapter } from './realtime/realtime.adapter';

async function bootstrap() {
  const serverEnv = loadServerEnv();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useWebSocketAdapter(new RealtimeSocketIoAdapter(app, serverEnv));

  if (serverEnv.TRUST_PROXY) {
    app.getHttpAdapter().getInstance().set('trust proxy', true);
  }

  if (serverEnv.CORS_ORIGIN) {
    app.enableCors({
      origin: serverEnv.CORS_ORIGIN,
      credentials: true,
    });
  }

  await app.listen(serverEnv.API_PORT);
}

void bootstrap();
