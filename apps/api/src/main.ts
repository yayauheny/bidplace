import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { loadServerEnv } from './core/config';

async function bootstrap() {
  const serverEnv = loadServerEnv();
  const app = await NestFactory.create(AppModule);

  if (serverEnv.CORS_ORIGIN) {
    app.enableCors({
      origin: serverEnv.CORS_ORIGIN,
    });
  }

  await app.listen(serverEnv.API_PORT);
}

void bootstrap();
