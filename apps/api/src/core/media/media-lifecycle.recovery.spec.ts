import { ImageProcessor } from '../../images/image-processor';
import { SharpImageProcessor } from './media-pipeline';
import { Logger, Module } from '@nestjs/common';
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
    new SharpImageProcessor(),
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
    { provide: ImageProcessor, useClass: SharpImageProcessor },
  ],
})(StartupRecoveryModule);

describe('media recovery scheduler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('stops after twenty failures, warns once and lets neighboring work finish within the eight-operation batch', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const failed = { id: 'exhausted', kind: 'REVOKE', state: 'PENDING', attemptCount: 0, nextAttemptAt: new Date(), leaseToken: null as string | null,
      objects: [{ objectId: 'object', object: { tier: 'PRIVATE', assetId: 'asset' } }] };
    const neighbor = { ...failed, id: 'neighbor', objects: [] };
    const rows = [failed, neighbor];
    const findMany = vi.fn(async (query: { where: { attemptCount?: { lt: number } }; take: number }) => rows.filter((row) =>
      row.state !== 'DONE' && row.nextAttemptAt <= new Date() && row.attemptCount < (query.where.attemptCount?.lt ?? Infinity),
    ).slice(0, query.take).map(({ id }) => ({ id })));
    const updateMany = vi.fn(async (query: { where: { id?: string; leaseToken?: string; state?: string; attemptCount?: { lt: number } }; data: Record<string, unknown> }) => {
      const row = rows.find((item) => item.id === query.where.id);
      if (!row || (query.where.leaseToken && row.leaseToken !== query.where.leaseToken) || row.attemptCount >= (query.where.attemptCount?.lt ?? Infinity)) return { count: 0 };
      const { attemptCount, ...data } = query.data;
      Object.assign(row, data);
      if (attemptCount) row.attemptCount += 1;
      return { count: 1 };
    });
    const client = {
      $queryRaw: vi.fn(),
      mediaOperation: {
        findMany, updateMany,
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => rows.find((row) => row.id === where.id)),
        findUniqueOrThrow: vi.fn(async ({ where }: { where: { id: string } }) => rows.find((row) => row.id === where.id)),
      },
      mediaObject: { count: vi.fn().mockResolvedValue(0), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      mediaAsset: { findMany: vi.fn().mockResolvedValue([]) },
      mediaOperationObject: { count: vi.fn().mockRejectedValue(new Error('transport unavailable')) },
    };
    const media = new MediaLifecycleService({ ...client, $transaction: async (callback: (tx: typeof client) => Promise<unknown>) => callback(client) } as never,
      {} as never, {} as never, recoveryEnv(), new SharpImageProcessor());
    media.onModuleDestroy();
    try {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await media.tick();
        vi.setSystemTime(Date.now() + 15_000);
      }
      const deadline = failed.nextAttemptAt;
      await media.tick();
      await media.run(failed.id);
      expect(failed.attemptCount).toBe(20);
      expect(failed.state).toBe('FAILED');
      expect(failed.nextAttemptAt).toBe(deadline);
      expect(neighbor.state).toBe('DONE');
      expect(findMany.mock.calls.every(([query]) => query.take === 8)).toBe(true);
      expect(warn.mock.calls).toEqual([['Media operation exhausted retries: exhausted REVOKE']]);
    } finally { warn.mockRestore(); }
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
      new SharpImageProcessor(),
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
