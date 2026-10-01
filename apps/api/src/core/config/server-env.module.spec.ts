import 'reflect-metadata';

import { type AnalyticsIngestRequest } from '@bidplace/contracts';
import { PrismaClient } from '@bidplace/database';
import { HttpException, SetMetadata } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsModule } from '../../analytics/analytics.module';
import { AnalyticsService } from '../../analytics/analytics.service';
import { AppModule } from '../../app.module';
import { AUTH_TOKEN_SECRET } from '../../auth/auth.constants';
import { AuthController } from '../../auth/auth.controller';
import { AuthModule } from '../../auth/auth.module';
import { AuthService } from '../../auth/auth.service';
import { OtpModule } from '../../otp/otp.module';
import { OtpService } from '../../otp/otp.service';
import { PasswordResetModule } from '../../password-reset/password-reset.module';
import { PasswordResetService } from '../../password-reset/password-reset.service';
import { PrismaService } from '../database';
import { ImageStore, PostgresImageStore, S3ImageStore } from '../image-store';
import { LocalMailTransport, MailTransport, SmtpMailTransport } from '../mail';
import { RATE_LIMIT_METADATA_KEY } from '../rate-limit/rate-limit.decorator';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { SERVER_ENV, loadServerEnv } from './env';
import {
  syntheticProductionServerEnv,
  syntheticServerEnv,
} from './synthetic-server-env';

const directories: string[] = [];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  for (const directory of directories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function writeSyntheticEnv(contents: string): string {
  const directory = fs.mkdtempSync(join(tmpdir(), 'bidplace-server-env-'));
  directories.push(directory);
  const filePath = join(directory, 'synthetic.env');
  fs.writeFileSync(filePath, contents);
  return filePath;
}

function restoreProcessEnv(
  keys: readonly string[],
  saved: ReadonlyMap<string, string | undefined>,
): void {
  for (const key of keys) {
    const value = saved.get(key);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

class RateLimitProbe {
  handle(): void {}
}

SetMetadata(RATE_LIMIT_METADATA_KEY, {
  keyPrefix: 'config-probe',
  limit: 1,
  windowMs: 60_000,
  scope: 'ip',
})(
  RateLimitProbe.prototype,
  'handle',
  Object.getOwnPropertyDescriptor(RateLimitProbe.prototype, 'handle'),
);

describe('server env ownership', () => {
  it('rejects invalid configuration before an application context exists', () => {
    const directory = fs.mkdtempSync(join(tmpdir(), 'bidplace-server-env-'));
    directories.push(directory);
    vi.stubEnv('BIDPLACE_ENV_FILE', join(directory, 'missing.env'));

    expect(() =>
      loadServerEnv({
        NODE_ENV: 'test',
        APP_ENV: 'local',
        DATABASE_URL: 'postgresql://synthetic:synthetic@127.0.0.1:5432/synthetic',
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it('loads the env file once and keeps that snapshot for later requests', async () => {
    const databaseUrl =
      'postgresql://synthetic:synthetic@127.0.0.1:5432/synthetic';
    const replacementUrl =
      'postgresql://synthetic:synthetic@127.0.0.1:5432/replaced';
    const filePath = writeSyntheticEnv(
      [`DATABASE_URL=${databaseUrl}`, 'JWT_SECRET=from-file'].join('\n'),
    );
    const keys = ['DATABASE_URL', 'NODE_ENV', 'APP_ENV', 'JWT_SECRET'] as const;
    const saved = new Map(keys.map((key) => [key, process.env[key]]));
    delete process.env.DATABASE_URL;
    vi.stubEnv('BIDPLACE_ENV_FILE', filePath);
    const explicitEnv = {
      NODE_ENV: 'test',
      APP_ENV: 'local',
      JWT_SECRET: 'from-explicit-env',
      ANALYTICS_INGEST_ENABLED: 'false',
    } as const;

    try {
      const env = loadServerEnv(explicitEnv);

      expect(env.DATABASE_URL).toBe(databaseUrl);
      expect(env.JWT_SECRET).toBe('from-explicit-env');
      expect(process.env.DATABASE_URL).toBe(databaseUrl);

      fs.writeFileSync(
        filePath,
        [`DATABASE_URL=${replacementUrl}`, 'JWT_SECRET=from-file'].join('\n'),
      );

      const prisma = new PrismaClient();
      const datasource = (
        prisma as unknown as {
          _engineConfig: {
            inlineDatasources: {
              db: { url: { fromEnvVar: string | null; value: string | null } };
            };
          };
        }
      )._engineConfig.inlineDatasources.db.url;
      expect(datasource.fromEnvVar).toBe('DATABASE_URL');
      expect(datasource.value).toBeNull();
      await prisma.$disconnect();

      vi.spyOn(PrismaService.prototype, '$connect').mockResolvedValue(undefined);
      vi.spyOn(PrismaService.prototype, '$disconnect').mockResolvedValue(
        undefined,
      );

      const app = await NestFactory.createApplicationContext(
        AppModule.forRoot(env),
        { logger: false, abortOnError: false },
      );

      try {
        expect(app.get(SERVER_ENV)).toBe(env);

        await app.select(AuthModule).get(AuthService, { strict: true }).getRules();
        await app
          .select(AnalyticsModule)
          .get(AnalyticsService, { strict: true })
          .ingest({
            anonymousId: '11111111-1111-4111-8111-111111111111',
            environment: 'local',
            events: [],
          } as AnalyticsIngestRequest);

        expect(app.get(SERVER_ENV)).toBe(env);
        expect(app.get(SERVER_ENV).DATABASE_URL).toBe(databaseUrl);
        expect(loadServerEnv(explicitEnv).DATABASE_URL).toBe(replacementUrl);
        expect(process.env.DATABASE_URL).toBe(databaseUrl);
        expect(
          app.select(OtpModule).get(OtpService, { strict: true }),
        ).toBeInstanceOf(OtpService);
        expect(
          app
            .select(PasswordResetModule)
            .get(PasswordResetService, { strict: true }),
        ).toBeInstanceOf(PasswordResetService);
      } finally {
        await app.close();
      }
    } finally {
      restoreProcessEnv(keys, saved);
    }
  });

  it('gives two application contexts different immutable snapshots', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('APP_ENV', 'local');
    vi.spyOn(PrismaService.prototype, '$connect').mockResolvedValue(undefined);
    vi.spyOn(PrismaService.prototype, '$disconnect').mockResolvedValue(undefined);

    const localEnv = syntheticServerEnv({
      JWT_SECRET: 'synthetic-context-a',
      TRUST_PROXY: 'true',
      ANALYTICS_INGEST_ENABLED: 'false',
    });
    const productionEnv = syntheticProductionServerEnv({
      JWT_SECRET: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      RATE_LIMIT_MAX_BUCKETS: '1',
    });
    const localApp = await NestFactory.createApplicationContext(
      AppModule.forRoot(localEnv),
      { logger: false, abortOnError: false },
    );
    const productionApp = await NestFactory.createApplicationContext(
      AppModule.forRoot(productionEnv),
      { logger: false, abortOnError: false },
    );

    try {
      expect(localApp.get(SERVER_ENV)).toBe(localEnv);
      expect(productionApp.get(SERVER_ENV)).toBe(productionEnv);
      expect(localApp.get(SERVER_ENV)).not.toBe(productionApp.get(SERVER_ENV));
      expect(Object.isFrozen(localApp.get(SERVER_ENV))).toBe(true);

      expect(
        localApp.select(AuthModule).get(AUTH_TOKEN_SECRET, { strict: true }),
      ).toBe('synthetic-context-a');
      expect(
        productionApp.select(AuthModule).get(AUTH_TOKEN_SECRET, {
          strict: true,
        }),
      ).toBe('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');

      expect(localApp.get(MailTransport)).toBeInstanceOf(LocalMailTransport);
      expect(productionApp.get(MailTransport)).toBeInstanceOf(SmtpMailTransport);
      expect(localApp.get(ImageStore)).toBeInstanceOf(PostgresImageStore);
      expect(productionApp.get(ImageStore)).toBeInstanceOf(S3ImageStore);

      const localResponse = { clearCookie: vi.fn() };
      await localApp
        .select(AuthModule)
        .get(AuthController, { strict: true })
        .logout(undefined, localResponse);
      expect(localResponse.clearCookie).toHaveBeenCalledWith(
        'bidplace_session',
        expect.objectContaining({ secure: false }),
      );

      const productionResponse = { clearCookie: vi.fn() };
      await productionApp
        .select(AuthModule)
        .get(AuthController, { strict: true })
        .logout(undefined, productionResponse);
      expect(productionResponse.clearCookie).toHaveBeenCalledWith(
        'bidplace_session',
        expect.objectContaining({ secure: true }),
      );

      const guard = localApp
        .select(RateLimitModule)
        .get(RateLimitGuard, { strict: true });
      const context = (ip: string) =>
        ({
          getHandler: () => RateLimitProbe.prototype.handle,
          getClass: () => RateLimitProbe,
          switchToHttp: () => ({
            getRequest: () => ({
              ip,
              params: {},
              socket: { remoteAddress: '10.0.0.1' },
            }),
          }),
        }) satisfies Parameters<RateLimitGuard['canActivate']>[0];

      expect(guard.canActivate(context('203.0.113.5'))).toBe(true);
      expect(guard.canActivate(context('198.51.100.9'))).toBe(true);
      expect(() => guard.canActivate(context('203.0.113.5'))).toThrow(
        HttpException,
      );

      const limits = productionApp
        .select(RateLimitModule)
        .get(RateLimitService, { strict: true });
      expect(limits.consume('bucket-a', 1, 60_000, 1_000)).toBe(true);
      expect(limits.consume('bucket-b', 1, 60_000, 1_000)).toBe(true);
      expect(limits.consume('bucket-a', 1, 60_000, 1_000)).toBe(true);

    } finally {
      await productionApp.close();
      await localApp.close();
    }
  });
});
