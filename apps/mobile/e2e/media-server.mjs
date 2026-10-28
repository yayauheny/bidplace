// Test transport only. This entry point is never imported by the production server.
import { NestFactory } from '../../../apps/api/node_modules/@nestjs/core/index.js';
import { AppModule } from '../../../apps/api/dist/app.module.js';
import { configureHttpApp } from '../../../apps/api/dist/bootstrap.js';
import { loadServerEnv } from '../../../apps/api/dist/core/config/env.js';
import { S3MediaObjectStore } from '../../../apps/api/dist/core/media/media-object-store.js';
import { CloudflarePublicMediaCache } from '../../../apps/api/dist/core/media/public-media-cache.js';
import { MediaLifecycleService } from '../../../apps/api/dist/core/media/media-lifecycle.service.js';

if (process.env.NODE_ENV !== 'test')
  throw new Error('Test media transport requires NODE_ENV=test');
Object.assign(process.env, {
  MEDIA_STORAGE_PROVIDER: 's3',
  S3_ENDPOINT: 'https://r2.example.test',
  S3_REGION: 'auto',
  S3_BUCKET: 'private',
  S3_PUBLIC_BUCKET: 'public',
  S3_ACCESS_KEY_ID: 'fixture',
  S3_SECRET_ACCESS_KEY: 'fixture',
  MEDIA_PUBLIC_BASE_URL: 'https://media.example.test',
  CLOUDFLARE_ZONE_ID: 'a'.repeat(32),
  CLOUDFLARE_CACHE_TOKEN: 'fixture',
});
const objects = new Map();
let failPublic = false;
S3MediaObjectStore.prototype.get = async (tier, key) =>
  objects.get(`${tier}:${key}`) ?? null;
S3MediaObjectStore.prototype.put = async (tier, key, value) => {
  if (tier === 'PUBLIC' && failPublic) throw new Error('Test provider outage');
  objects.set(`${tier}:${key}`, value);
};
S3MediaObjectStore.prototype.delete = async (tier, key) => {
  objects.delete(`${tier}:${key}`);
};
CloudflarePublicMediaCache.prototype.purge = async () => {};
const env = loadServerEnv();
const app = await NestFactory.create(AppModule.forRoot(env), { logger: false });
configureHttpApp(app, env);
const server = app.getHttpAdapter().getInstance();
server.get('/__media', (request, response) => {
  const value = objects.get(`PUBLIC:${request.query.key}`);
  response.setHeader('Access-Control-Allow-Origin', env.CORS_ORIGIN);
  if (!value) return response.status(404).end();
  response.type(value.mimeType).send(Buffer.from(value.bytes));
});
server.post('/__media-fault', (request, response) => {
  failPublic = request.query.fail === 'true';
  response.json({ ok: true, failPublic });
});
server.post('/__media-run', async (_request, response) => {
  await app.get(MediaLifecycleService).tick();
  response.json({ ok: true });
});
await app.init();
app.get(MediaLifecycleService).onModuleDestroy();
await app.listen(Number(env.API_PORT));
