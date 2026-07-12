import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';

import { AppModule } from './app.module';
import { loadServerEnv } from './core/config';

async function bootstrap() {
  const serverEnv = loadServerEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  if (serverEnv.CORS_ORIGIN) {
    app.enableCors({
      origin: serverEnv.CORS_ORIGIN,
    });
  }

  await app.listen(serverEnv.API_PORT);
}

void bootstrap();
