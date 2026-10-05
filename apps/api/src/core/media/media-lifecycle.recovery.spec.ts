import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SERVER_ENV } from '../config';
import { syntheticServerEnv } from '../config/synthetic-server-env';
import { PrismaService } from '../database';
import { MediaLifecycleService } from './media-lifecycle.service';
import { MediaObjectStore } from './media-object-store';
import { PublicMediaCache } from './public-media-cache';

type Script = {
  down: boolean;
  young: number;
  pending: number;
  failOperationCount: boolean;
  reads: string[];
};

function recoveryEnv() {
  return syntheticServerEnv({
    MEDIA_STORAGE_PROVIDER: 's3',
    S3_ENDPOINT: 'https://r2.example.com',
    S3_REGION: 'auto',
    S3_BUCKET: 'private',
    S3_PUBLIC_BUCKET: 'public',
    S3_ACCESS_KEY_ID: 'test',
    S3_SECRET_ACCESS_KEY: 'test',
    CLOUDFLARE_ZONE_ID: 'a'.repeat(32),
    CLOUDFLARE_CACHE_TOKEN: 'test',
    MEDIA_PUBLIC_BASE_URL: 'https://media.example.com',
  });
}

function scriptedClient(script: Script) {
  const read = (name: string) => {
    script.reads.push(name);
    if (script.down) throw new Error('database unavailable');
  };
  return {
    mediaOperation: {
      findMany: async () => {
        read('operation.findMany');
        return [];
      },
      count: async () => {
        read('operation.count');
        if (script.failOperationCount) {
          script.failOperationCount = false;
          throw new Error('database unavailable');
        }
        return script.pending;
      },
    },
    mediaAsset: {
      findMany: async () => {
        read('asset.findMany');
        return [];
      },
      count: async () => {
        read('asset.count');
        return script.young;
      },
    },
  };
}

function recoveryService(script: Script) {
  return new MediaLifecycleService(
    scriptedClient(script) as never,
    {
      get: async () => null,
      head: async () => null,
      put: async () => undefined,
      delete: async () => undefined,
    } as never,
    { purge: async () => undefined } as never,
    recoveryEnv(),
  );
}

let startupScans = 0;

class StartupRecoveryModule {}
Module({
  providers: [
    MediaLifecycleService,
    {
      provide: PrismaService,
      useValue: {
        mediaOperation: {
          findMany: () => {
            startupScans += 1;
            return new Promise(() => undefined);
          },
          count: async () => 0,
        },
        mediaAsset: {
          findMany: () => new Promise(() => undefined),
          count: async () => 0,
        },
      },
    },
    {
      provide: MediaObjectStore,
      useValue: {
        get: async () => null,
        head: async () => null,
        put: async () => undefined,
        delete: async () => undefined,
      },
    },
    { provide: PublicMediaCache, useValue: { purge: async () => undefined } },
    { provide: SERVER_ENV, useFactory: recoveryEnv },
  ],
})(StartupRecoveryModule);

describe('media recovery scheduler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not poll after a healthy empty startup', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const script: Script = {
      down: false,
      young: 0,
      pending: 0,
      failOperationCount: false,
      reads: [],
    };
    const media = recoveryService(script);
    await media.onModuleInit();
    await vi.advanceTimersByTimeAsync(5_000);
    const startupReads = script.reads.length;
    expect(startupReads).toBeGreaterThan(0);
    await vi.advanceTimersByTimeAsync(15 * 60_000);
    expect(script.reads).toHaveLength(startupReads);
    media.onModuleDestroy();
  });

  it('retries recovery after a database outage and then stops when no work remains', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const script: Script = {
      down: true,
      young: 0,
      pending: 0,
      failOperationCount: false,
      reads: [],
    };
    const media = recoveryService(script);
    await media.onModuleInit();
    const duringOutage = script.reads.length;
    await vi.advanceTimersByTimeAsync(5_000);
    expect(script.reads.length).toBeGreaterThan(duringOutage);
    script.down = false;
    await vi.advanceTimersByTimeAsync(5_000);
    const recovered = script.reads.length;
    expect(recovered).toBeGreaterThan(duringOutage);
    await vi.advanceTimersByTimeAsync(15 * 60_000);
    expect(script.reads).toHaveLength(recovered);
    media.onModuleDestroy();
  });

  it('keeps a recovery attempt when the orphan scan cannot read outstanding work', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const script: Script = {
      down: false,
      young: 1,
      pending: 0,
      failOperationCount: false,
      reads: [],
    };
    const media = recoveryService(script);
    await media.onModuleInit();
    await vi.advanceTimersByTimeAsync(5_000);
    const scheduled = script.reads.length;
    await vi.advanceTimersByTimeAsync(5_000);
    expect(script.reads).toHaveLength(scheduled);
    script.young = 0;
    script.failOperationCount = true;
    await vi.advanceTimersByTimeAsync(10 * 60_000 - 5_000);
    const failedCheck = script.reads.length;
    expect(failedCheck).toBeGreaterThan(scheduled);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(script.reads.length).toBeGreaterThan(failedCheck);
    const settled = script.reads.length;
    await vi.advanceTimersByTimeAsync(15 * 60_000);
    expect(script.reads).toHaveLength(settled);
    media.onModuleDestroy();
  });

  it('lets Nest finish init while startup recovery is still hanging', async () => {
    startupScans = 0;
    const app = await NestFactory.create(StartupRecoveryModule, {
      logger: false,
    });
    const status = await Promise.race([
      app.init().then(() => 'ready' as const),
      new Promise<'blocked'>((resolve) => {
        setTimeout(() => resolve('blocked'), 1_000).unref();
      }),
    ]);
    expect(status).toBe('ready');
    expect(app.get(MediaLifecycleService).enabled).toBe(true);
    await app.close();
    expect(startupScans).toBe(0);
  });

  it('retries one failed abandoned-staging scan and then stops after an empty pass', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    let failScan = true;
    const reads: string[] = [];
    const media = new MediaLifecycleService(
      {
        mediaOperation: {
          findMany: async () => {
            reads.push('operation.findMany');
            return [];
          },
          count: async () => {
            reads.push('operation.count');
            return 0;
          },
        },
        mediaAsset: {
          findMany: async () => {
            reads.push('asset.findMany');
            if (failScan) throw new Error('abandoned staging scan failed');
            return [];
          },
          count: async () => {
            reads.push('asset.count');
            return 0;
          },
        },
      } as never,
      {
        get: async () => null,
        head: async () => null,
        put: async () => undefined,
        delete: async () => undefined,
      } as never,
      { purge: async () => undefined } as never,
      recoveryEnv(),
    );
    await media.onModuleInit();
    await vi.advanceTimersByTimeAsync(5_000);
    expect(reads.filter((name) => name === 'asset.findMany')).toHaveLength(1);
    const afterFailure = reads.length;
    failScan = false;
    await vi.advanceTimersByTimeAsync(5_000);
    expect(reads.length).toBeGreaterThan(afterFailure);
    expect(reads.filter((name) => name === 'asset.findMany').length).toBe(2);
    const settled = reads.length;
    await vi.advanceTimersByTimeAsync(15 * 60_000);
    expect(reads).toHaveLength(settled);
    media.onModuleDestroy();
  });

  it('does not resume recovery after shutdown', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const script: Script = {
      down: false,
      young: 0,
      pending: 1,
      failOperationCount: false,
      reads: [],
    };
    const media = recoveryService(script);
    await media.onModuleInit();
    await vi.advanceTimersByTimeAsync(5_000);
    const scheduled = script.reads.length;
    expect(scheduled).toBeGreaterThan(0);
    media.onModuleDestroy();
    script.pending = 1;
    await vi.advanceTimersByTimeAsync(15 * 60_000);
    expect(script.reads).toHaveLength(scheduled);
  });
});
