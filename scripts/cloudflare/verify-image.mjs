import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { root } from './config.mjs';

const image = 'bidplace-cloudflare-verify:local';
const suffix = randomUUID().slice(0, 8);
const network = `bidplace-cf-smoke-${suffix}`;
const db = `${network}-db`;
const api = `${network}-api`;
const temporary = mkdtempSync(join(tmpdir(), 'bidplace-cf-smoke-'));
const docker = (args) => execFileSync('docker', args, { cwd: root, encoding: 'utf8' }).trim();
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
};

try {
  run('docker', ['build', '--platform', 'linux/amd64', '-f', 'apps/api/Dockerfile', '-t', image, '.']);
  if (docker(['image', 'inspect', image, '--format', '{{.Os}}/{{.Architecture}}']) !== 'linux/amd64') {
    throw new Error('API image must be linux/amd64');
  }
  run('docker', ['run', '--rm', '--platform', 'linux/amd64', '--entrypoint', 'node', image, '-e', `
    (async () => {
      const fs = require('node:fs');
      const path = require('node:path');
      function rejectRuntimeFiles(directory) {
        for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
          const file = path.join(directory, entry.name);
          if (entry.isDirectory()) rejectRuntimeFiles(file);
          else if (/^\\.env($|\\.)|^\\.dev\\.vars/.test(entry.name)) throw new Error('Runtime configuration file in image');
        }
      }
      rejectRuntimeFiles('/app');
      const argon2 = require('argon2');
      const hash = await argon2.hash('local-native-smoke');
      if (!await argon2.verify(hash, 'local-native-smoke')) throw new Error('Argon2');
      const bytes = await require('sharp')({create: {width: 2, height: 2, channels: 3, background: '#ffffff'}}).webp().toBuffer();
      if ((await require('sharp')(bytes).metadata()).format !== 'webp') throw new Error('Sharp');
      require('@bidplace/database');
      console.log('No dotenv files; native Argon2/Sharp/Prisma modules load on ' + process.arch);
    })().catch(() => { console.error('Native module smoke failed'); process.exit(1); });
  `]);
  docker(['network', 'create', network]);
  docker(['run', '-d', '--name', db, '--network', network, '-p', '127.0.0.1::5432',
    '-e', 'POSTGRES_USER=smoke', '-e', 'POSTGRES_PASSWORD=local-smoke-only',
    '-e', 'POSTGRES_DB=bidplace_cloudflare_smoke', 'postgres:16-alpine']);
  let dbReady = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    const result = spawnSync('docker', ['exec', db, 'pg_isready', '-U', 'smoke'], { stdio: 'ignore' });
    if (result.status === 0) { dbReady = true; break; }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!dbReady) throw new Error('Disposable DB did not start');
  const dbPort = docker(['port', db, '5432/tcp']).split(':').at(-1);
  cpSync(join(root, 'packages/database/prisma/schema.prisma'), join(temporary, 'schema.prisma'));
  cpSync(join(root, 'packages/database/prisma/migrations'), join(temporary, 'migrations'), { recursive: true });
  // Private working directory avoids Prisma loading any repository dotenv file.
  run('node', [join(root, 'packages/database/node_modules/prisma/build/index.js'), 'migrate', 'deploy',
    '--schema', join(temporary, 'schema.prisma')], {
    cwd: temporary, env: { ...process.env,
      DATABASE_URL: `postgresql://smoke:local-smoke-only@127.0.0.1:${dbPort}/bidplace_cloudflare_smoke` },
  });
  const env = {
    NODE_ENV: 'production', APP_ENV: 'staging', API_PORT: '3001',
    DATABASE_URL: `postgresql://smoke:local-smoke-only@${db}:5432/bidplace_cloudflare_smoke?connection_limit=3`,
    JWT_SECRET: 'local-image-smoke-only-not-a-runtime-secret',
    CORS_ORIGIN: 'https://staging.bid.place', TRUST_PROXY: 'true',
    SMTP_HOST: 'smtp.example.invalid', SMTP_PORT: '587', SMTP_SECURE: 'false', SMTP_AUTH_MODE: 'none',
    SMTP_FROM: 'smoke@example.invalid', PASSWORD_RESET_URL_BASE: 'https://staging.bid.place',
    SERVICE_RULES_OWNER: 'Local image smoke', SERVICE_RULES_CONTACT: 'smoke@example.invalid',
    SERVICE_RULES_TEXT: 'Local verification only; never deployed.', TEST_EMAIL_BYPASS: 'false',
    MEDIA_STORAGE_PROVIDER: 's3', S3_ENDPOINT: 'https://r2.example.invalid', S3_REGION: 'auto',
    S3_BUCKET: 'local-private', S3_PUBLIC_BUCKET: 'local-public', MEDIA_PUBLIC_BASE_URL: 'https://media-staging.bid.place',
    S3_ACCESS_KEY_ID: 'local-smoke-only', S3_SECRET_ACCESS_KEY: 'local-smoke-only',
    CLOUDFLARE_ZONE_ID: 'a'.repeat(32), CLOUDFLARE_CACHE_TOKEN: 'local-smoke-only',
  };
  docker(['run', '-d', '--platform', 'linux/amd64', '--name', api, '--network', network,
    '--cpus', '0.25', '--memory', '1g', '-p', '127.0.0.1::3001',
    ...Object.entries(env).flatMap(([name, value]) => ['-e', `${name}=${value}`]), image]);
  const port = docker(['port', api, '3001/tcp']).split(':').at(-1);
  const origin = `http://127.0.0.1:${port}`;
  let ready = false;
  let startupResult = 'no probe completed';
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const result = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(1000) });
      await result.body?.cancel();
      startupResult = `HTTP ${result.status}`;
      if (result.status === 200) { ready = true; break; }
    } catch (error) {
      startupResult = error instanceof Error ? error.name : 'connection unavailable';
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error(`API container did not start within the smoke budget: ${startupResult}`);
  for (const [path, status] of [['/api/health/ready', 200], ['/api/categories', 200],
    ['/api/auth/me', 401], ['/api/no-such-endpoint', 404]]) {
    const response = await fetch(origin + path, { signal: AbortSignal.timeout(5000) });
    await response.body?.cancel();
    if (response.status !== status) throw new Error(`Smoke ${path}: expected ${status}, got ${response.status}`);
  }
  docker(['stop', '--time', '15', api]);
  if (docker(['inspect', api, '--format', '{{.State.ExitCode}}']) !== '0') {
    throw new Error('SIGTERM did not shut down Nest gracefully');
  }
  console.log('linux/amd64 image: native modules, migrated DB, HTTP/auth boundary and SIGTERM passed');
} finally {
  for (const name of [api, db]) spawnSync('docker', ['rm', '-f', name], { stdio: 'ignore' });
  spawnSync('docker', ['network', 'rm', network], { stdio: 'ignore' });
  rmSync(temporary, { recursive: true, force: true });
}
