import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  configPath,
  configureTickSchedule,
  deploymentConfig,
  root,
  turnstileSiteKeyForBuild,
  validateConfig,
} from './config.mjs';

function configured(target) {
  const config = deploymentConfig(target);
  Object.assign(config.vars, {
    SMTP_HOST: 'smtp.example.invalid',
    SMTP_FROM: 'test@example.invalid',
    SERVICE_RULES_OWNER: 'Test operator',
    SERVICE_RULES_CONTACT: 'test@example.invalid',
    SERVICE_RULES_TEXT: 'Test rules',
    S3_ENDPOINT: 'https://example.r2.cloudflarestorage.com',
    CLOUDFLARE_ZONE_ID: 'a'.repeat(32),
  });
  return config;
}

test('confirmed mail settings stay fail-closed without GitHub service rules', () => {
  const config = deploymentConfig('production');
  assert.equal(config.vars.SMTP_HOST, 'smtp.mx.cloudflare.net');
  assert.equal(config.vars.SMTP_PORT, '465');
  assert.equal(config.vars.SMTP_SECURE, 'true');
  assert.equal(config.vars.SMTP_AUTH_MODE, 'login');
  assert.equal(config.vars.SMTP_FROM, 'noreply@bid.place');
  assert.equal(config.vars.TEST_EMAIL_BYPASS, 'false');
  assert.equal(config.vars.AUTH_MAIL_DAILY_BUDGET, '200');
  assert.equal(config.vars.AUTH_MAIL_MONTHLY_BUDGET, '3000');
  assert.equal(config.vars.TURNSTILE_SITE_KEY, '');
  assert.equal(Object.hasOwn(config.vars, 'TURNSTILE_SECRET_KEY'), false);
  const emptyFrom = deploymentConfig('production');
  emptyFrom.vars = { ...emptyFrom.vars, SMTP_FROM: '' };
  assert.throws(() => validateConfig(emptyFrom), /SMTP_FROM/);
  const production = deploymentConfig('production');
  assert.equal(production.vars.SERVICE_RULES_OWNER, '');
  assert.equal(production.vars.SERVICE_RULES_CONTACT, '');
  assert.equal(production.vars.SERVICE_RULES_TEXT, '');
  assert.throws(() => validateConfig(production), /SERVICE_RULES_OWNER/);
});
test('the production contract passes', () => {
  validateConfig(configured('production'));
});
test('shared media buckets and test bypass are rejected', () => {
  const config = configured('production');
  config.vars.S3_PUBLIC_BUCKET = config.vars.S3_BUCKET;
  assert.throws(() => validateConfig(config), /Buckets must differ/);
  const bypass = configured('production');
  bypass.vars.TEST_EMAIL_BYPASS = 'true';
  assert.throws(() => validateConfig(bypass), /production security/);
});
test('origin mismatch and missing runtime secrets are rejected', () => {
  const config = configured('production');
  config.vars.CORS_ORIGIN = 'https://staging.bid.place';
  assert.throws(() => validateConfig(config), /origins must match/);
  const secrets = configured('production');
  secrets.secrets.required.pop();
  assert.throws(() => validateConfig(secrets), /required secrets differ/);
});

test('release and internal routes reach the worker before the SPA fallback', async () => {
  const full = JSON.parse(readFileSync(configPath, 'utf8'));
  assert.equal(full.env.production.assets, undefined);
  assert.equal(full.assets.not_found_handling, 'single-page-application');
  assert.deepEqual(full.assets.run_worker_first, ['/api', '/api/*', '/_release/stop', '/_release/state']);
  const wranglerPackage = realpathSync(
    new URL('../../node_modules/wrangler/package.json', import.meta.url),
  );
  const { Miniflare } = createRequire(wranglerPackage)('miniflare');
  const directory = mkdtempSync(join(tmpdir(), 'bidplace-assets-'));
  writeFileSync(join(directory, 'index.html'), 'SPA');
  const worker = new Miniflare({
    workers: [
      {
        config: {
          name: 'bidplace-production',
          compatibilityDate: '2026-10-05',
          manifest: {
            mainModule: 'index.js',
            modules: {
              'index.js': {
                type: 'esm',
                contents:
                  'export default { fetch() { return new Response("WORKER"); } }',
              },
            },
          },
          assets: {
            directory,
            hasUserWorker: true,
            notFoundHandling: 'single-page-application',
            runWorkerFirst: full.assets.run_worker_first,
          },
        },
      },
    ],
  });
  try {
    for (const path of ['/_release/stop', '/_release/state', '/api/internal/tick', '/api/%69nternal/tick']) {
      for (const method of ['GET', 'POST']) {
        const response = await worker.dispatchFetch(
          `https://bid.place${path}`,
          { method },
        );
        assert.equal(response.status, 200);
        assert.equal(await response.text(), 'WORKER');
      }
    }
    const spa = await worker.dispatchFetch('https://bid.place/login');
    assert.equal(await spa.text(), 'SPA');
  } finally {
    await worker.dispose();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('public turnstile site key prefers the caller and falls back to the wrangler value', () => {
  assert.equal(
    turnstileSiteKeyForBuild('  caller-site  ', 'configured-site'),
    'caller-site',
  );
  assert.equal(
    turnstileSiteKeyForBuild('   ', '  configured-site '),
    'configured-site',
  );
  assert.equal(
    turnstileSiteKeyForBuild(undefined, 'configured-site'),
    'configured-site',
  );
  assert.throws(
    () => turnstileSiteKeyForBuild('  ', ''),
    /TURNSTILE_SITE_KEY is required/,
  );
  assert.throws(
    () => turnstileSiteKeyForBuild(undefined, undefined),
    /TURNSTILE_SITE_KEY is required/,
  );
});

function fakePnpm() {
  const folder = mkdtempSync(join(tmpdir(), 'bidplace-web-build-'));
  const bin = join(folder, 'bin');
  mkdirSync(bin);
  writeFileSync(
    join(bin, 'pnpm'),
    `#!/bin/sh
printf '%s\\n' "$EXPO_PUBLIC_TURNSTILE_SITE_KEY" "$TURNSTILE_SECRET_KEY" "$EXPO_PUBLIC_ANALYTICS_WEB_ENABLED" > "$BIDPLACE_BUILD_CAPTURE"
exit 1
`,
  );
  chmodSync(join(bin, 'pnpm'), 0o755);
  return { folder, bin };
}

function runWebBuild(env) {
  return spawnSync(
    process.execPath,
    [join(root, 'scripts/cloudflare/build-web.mjs'), 'production'],
    {
      encoding: 'utf8',
      env,
    },
  );
}

test('cloudflare web build fails closed before export when the public site key is absent', () => {
  const folder = mkdtempSync(join(tmpdir(), 'bidplace-web-missing-'));
  const capture = join(folder, 'captured');
  const fixture = fakePnpm();
  try {
    const result = runWebBuild({
      PATH: fixture.bin,
      EXPO_NO_DOTENV: '1',
      BIDPLACE_BUILD_CAPTURE: capture,
    });
    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}${result.stderr}`,
      /TURNSTILE_SITE_KEY is required/,
    );
    assert.equal(existsSync(capture), false);
  } finally {
    rmSync(folder, { recursive: true, force: true });
    rmSync(fixture.folder, { recursive: true, force: true });
  }
});

test('cloudflare web build forwards the caller site key and replaces the backend secret', () => {
  const siteKey = 'task-public-site-key';
  const parentSecret = 'parent-turnstile-secret-canary';
  const folder = mkdtempSync(join(tmpdir(), 'bidplace-web-forward-'));
  const capture = join(folder, 'captured');
  const fixture = fakePnpm();
  try {
    const result = runWebBuild({
      PATH: fixture.bin,
      EXPO_NO_DOTENV: '1',
      BIDPLACE_BUILD_CAPTURE: capture,
      TURNSTILE_SITE_KEY: `  ${siteKey}  `,
      TURNSTILE_SECRET_KEY: parentSecret,
      EXPO_PUBLIC_ANALYTICS_WEB_ENABLED: 'true',
    });
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(
      `${result.stdout}${result.stderr}`,
      new RegExp(`${siteKey}|${parentSecret}`),
    );
    const [forwarded, isolated, analytics] = readFileSync(
      capture,
      'utf8',
    ).split('\n');
    assert.equal(analytics, 'false');
    assert.equal(forwarded, siteKey);
    assert.ok(isolated);
    assert.notEqual(isolated, parentSecret);
    assert.notEqual(isolated, siteKey);
  } finally {
    rmSync(folder, { recursive: true, force: true });
    rmSync(fixture.folder, { recursive: true, force: true });
  }
});

test('secrets in vars and public bypass URLs fail the preflight', () => {
  const config = configured('production');
  config.vars.SESSION_SECRET = 'local-secret-canary';
  assert.throws(() => validateConfig(config), /must not be stored/);
  const bypass = configured('production');
  bypass.workers_dev = true;
  assert.throws(() => validateConfig(bypass), /disable public bypass/);
});

test('tick schedule is opt-in and replaces stale template triggers', () => {
  for (const cron of [undefined, '', '   ']) {
    const config = { vars: {}, triggers: { crons: ['* * * * *'] } };
    configureTickSchedule(config, cron);
    assert.equal(Object.hasOwn(config, 'triggers'), false);
    assert.equal(config.vars.TICK_CRON, '');
  }
  const config = { vars: {} };
  configureTickSchedule(config, '  */5 * * * *  ');
  assert.deepEqual(config.triggers.crons, ['*/5 * * * *']);
  assert.equal(config.vars.TICK_CRON, '*/5 * * * *');
});

test('tick schedule rejects invalid cron fields without echoing the input', () => {
  for (const cron of ['garbage', '* * * *', '* * * * * *', '60 * * * *',
    '*/0 * * * *', '* 24 * * *', '* * 0 * *', '* * * 13 *', '* * * * 8',
    '5-2 * * * *', '* * * * MON#6', '0 0 * JANFEB *',
    '0 0 * JANJAN *', '0 0 * 1JAN *']) {
    assert.throws(() => configureTickSchedule({ vars: {} }, cron), /^Error: Invalid TICK_CRON$/);
  }
  for (const cron of ['0,30 1-5/2 * JAN,MAR MON-FRI', '0 0 L * *', '0 0 15W * *', '0 0 * * FRIL', '0 0 * * MON#2']) {
    const config = { vars: {} };
    configureTickSchedule(config, cron);
    assert.deepEqual(config.triggers.crons, [cron]);
  }
});

test('only production is a supported deployment target', () => {
  const full = JSON.parse(readFileSync(configPath, 'utf8'));
  assert.deepEqual(Object.keys(full.env), ['production']);
  for (const target of ['staging', undefined, 'preview']) {
    assert.throws(() => deploymentConfig(target), /Choose production/);
  }
  const scripts = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts;
  assert.equal(Object.hasOwn(scripts, 'cloudflare:deploy:staging'), false);
  assert.equal(Object.hasOwn(scripts, 'cloudflare:build:staging'), false);
});
