import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deploymentConfig, root } from './config.mjs';

export async function assertStagingAccess(fetcher = fetch) {
  const response = await fetcher('https://staging.bid.place/api/health', {
    redirect: 'manual',
    signal: AbortSignal.timeout(30_000),
  });
  if ([401, 403].includes(response.status)) return;
  let hostname;
  try {
    hostname = new URL(response.headers.get('location')).hostname;
  } catch {
    throw new Error('Staging is not protected by Cloudflare Access');
  }
  if (
    ![302, 303, 307].includes(response.status) ||
    !hostname.endsWith('.cloudflareaccess.com')
  ) {
    throw new Error('Staging is not protected by Cloudflare Access');
  }
}

export function assertStagingDatabaseUrl(raw, endpointId, pooled) {
  if (
    !/^ep-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(endpointId ?? '') ||
    endpointId.endsWith('-pooler')
  ) {
    throw new Error(
      'STAGING_NEON_ENDPOINT_ID must identify the approved direct staging endpoint',
    );
  }
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Invalid staging database URL; value is not logged');
  }
  const host = url.hostname.split('.')[0];
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !url.hostname.endsWith('.neon.tech') ||
    url.searchParams.get('sslmode') !== 'require' ||
    url.pathname !== '/neondb' ||
    host !== `${endpointId}${pooled ? '-pooler' : ''}` ||
    endpointId === 'ep-withered-shadow-b230htte'
  ) {
    throw new Error(
      'Staging database must use the approved isolated Neon endpoint and pooling mode',
    );
  }
}

export function assertStagingConfig(config) {
  const production = deploymentConfig('production');
  if (
    config.name !== 'bidplace-staging' ||
    config.vars.APP_ENV !== 'staging' ||
    config.vars.API_URL !== 'https://staging.bid.place' ||
    config.vars.S3_BUCKET !== 'bidplace-staging-media-private' ||
    config.vars.S3_PUBLIC_BUCKET !== 'bidplace-staging-media-public' ||
    config.vars.MEDIA_PUBLIC_BASE_URL !== 'https://media-staging.bid.place' ||
    ['S3_BUCKET', 'S3_PUBLIC_BUCKET'].some((name) =>
      [production.vars.S3_BUCKET, production.vars.S3_PUBLIC_BUCKET].includes(
        config.vars[name],
      ),
    )
  ) {
    throw new Error(
      'Staging must use its own Worker, application origin and media buckets',
    );
  }
}

export function assertStagingMigrationsApplied(databaseUrl) {
  const directory = mkdtempSync(join(tmpdir(), 'bidplace-staging-schema-'));
  try {
    cpSync(
      join(root, 'packages/database/prisma/schema.prisma'),
      join(directory, 'schema.prisma'),
    );
    cpSync(
      join(root, 'packages/database/prisma/migrations'),
      join(directory, 'migrations'),
      { recursive: true },
    );
    const result = spawnSync(
      process.execPath,
      [
        join(root, 'packages/database/node_modules/prisma/build/index.js'),
        'migrate',
        'status',
        '--schema',
        join(directory, 'schema.prisma'),
      ],
      {
        cwd: directory,
        encoding: 'utf8',
        env: { PATH: process.env.PATH, DATABASE_URL: databaseUrl },
      },
    );
    if (result.error || result.status !== 0) {
      throw new Error(
        'Staging migration status is not ready; run the guarded migration separately',
      );
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

export async function assertStagingMigrationStopped(env, fetcher = fetch) {
  if (
    !env.CF_ACCESS_CLIENT_ID ||
    !env.CF_ACCESS_CLIENT_SECRET ||
    !env.RELEASE_CONTROL
  ) {
    throw new Error(
      'Staging migration requires Access service credentials and RELEASE_CONTROL',
    );
  }
  const headers = {
    'CF-Access-Client-Id': env.CF_ACCESS_CLIENT_ID,
    'CF-Access-Client-Secret': env.CF_ACCESS_CLIENT_SECRET,
    Authorization: `Bearer ${env.RELEASE_CONTROL}`,
  };
  const api = await fetcher('https://staging.bid.place/api/health', {
    headers: {
      'CF-Access-Client-Id': env.CF_ACCESS_CLIENT_ID,
      'CF-Access-Client-Secret': env.CF_ACCESS_CLIENT_SECRET,
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(30_000),
  });
  const state = await fetcher('https://staging.bid.place/_release/state', {
    headers,
    redirect: 'manual',
    signal: AbortSignal.timeout(30_000),
  });
  if (
    api.status !== 503 ||
    state.status !== 200 ||
    !state.headers.get('content-type')?.includes('application/json')
  ) {
    throw new Error('Close and stop the staging API before migration');
  }
  let payload;
  try {
    payload = await state.json();
  } catch {
    throw new Error('Staging container state is not valid JSON');
  }
  if (payload.status !== 'stopped' && payload.status !== 'stopped_with_code') {
    throw new Error('Close and stop the staging API before migration');
  }
}

if (
  process.argv[1] === fileURLToPath(import.meta.url) &&
  process.argv[2] === 'check-access'
) {
  assertStagingAccess().catch(() => {
    console.error('Staging Access preflight failed; deployment refused.');
    process.exitCode = 1;
  });
}
