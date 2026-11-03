import { NestFactory } from '../node_modules/@nestjs/core/index.js';
import { AppModule } from '../dist/app.module.js';
import { configureHttpApp } from '../dist/bootstrap.js';
import { CatalogService } from '../dist/catalog/catalog.service.js';
import { loadServerEnv } from '../dist/core/config/index.js';
import { TickService } from '../dist/core/tick/tick.service.js';

if (process.env.NODE_ENV !== 'test' || !process.send) throw new Error('Requires the isolated commerce test parent');
try {
  const env = loadServerEnv();
  const app = await NestFactory.create(AppModule.forRoot(env), { logger: false, abortOnError: false });
  app.enableShutdownHooks();
  await app.get(CatalogService).bootstrap();
  configureHttpApp(app, env);
  await app.listen(Number(process.env.COMMERCE_TEST_PORT), '127.0.0.1');
  // The parent advances time explicitly, without background tick contention.
  app.get(TickService).onModuleDestroy();
  process.send({ baseUrl: await app.getUrl() });
} catch {
  process.send({ error: 'Commerce test API failed to start' });
  process.exitCode = 1;
  process.disconnect();
}
