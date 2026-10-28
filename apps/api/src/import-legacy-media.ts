import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadServerEnv } from './core/config';
import { PrismaService } from './core/database';
import { ImageStore } from './core/image-store';
import { MediaLifecycleService } from './core/media/media-lifecycle.service';
import { importLegacyMedia } from './core/media/import-legacy-media';

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--apply', '--maintenance-confirmed'].includes(arg)))
    throw new Error('Unknown import argument');
  const apply = args.includes('--apply');
  if (apply && !args.includes('--maintenance-confirmed'))
    throw new Error(
      'Stop application traffic and take a database backup before applying the import',
    );
  const app = await NestFactory.createApplicationContext(
    AppModule.forRoot(loadServerEnv()),
    { logger: false },
  );
  const media = app.get(MediaLifecycleService);
  media.onModuleDestroy();
  try {
    console.log(
      JSON.stringify(
        await importLegacyMedia(
          app.get(PrismaService),
          media,
          app.get(ImageStore),
          apply,
        ),
      ),
    );
  } finally {
    await app.close();
  }
}
void main().catch(() => {
  console.error(
    'Legacy media import failed; keep maintenance enabled and inspect source integrity/provider availability.',
  );
  process.exitCode = 1;
});
