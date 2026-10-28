import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { configureHttpApp } from './bootstrap';
import { CatalogService } from './catalog/catalog.service';
import { loadServerEnv, resolveCorsOrigin } from './core/config';

async function bootstrap() {
  const serverEnv = loadServerEnv();
  const runtimeEnv = {
    ...serverEnv,
    CORS_ORIGIN: resolveCorsOrigin(serverEnv),
  };
  const app = await NestFactory.create(AppModule.forRoot(serverEnv));
  await app.get(CatalogService).bootstrap();
  configureHttpApp(app, runtimeEnv);
  app.enableShutdownHooks();

  await app.listen(runtimeEnv.API_PORT);
}

void bootstrap();
