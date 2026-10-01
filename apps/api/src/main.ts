import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { configureHttpApp } from './bootstrap';
import { loadServerEnv, resolveCorsOrigin } from './core/config';

async function bootstrap() {
  const serverEnv = loadServerEnv();
  const runtimeEnv = {
    ...serverEnv,
    CORS_ORIGIN: resolveCorsOrigin(serverEnv),
  };
  const app = await NestFactory.create(AppModule.forRoot(serverEnv));
  configureHttpApp(app, runtimeEnv);

  await app.listen(runtimeEnv.API_PORT);
}

void bootstrap();
