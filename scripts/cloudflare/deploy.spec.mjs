import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { requiredSecrets } from '../../deploy/cloudflare/src/environment.ts';
import { root } from './config.mjs';
import { assertSecretsFile, gateEnvironment, writeProductionConfig } from './deploy.mjs';

const canary = 'local-secret-canary';

function secrets(overrides = {}) {
  return {
    DATABASE_URL: `postgresql://role:${canary}@ep-test-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`,
    JWT_SECRET: 'local-secret-canary-jwt-value-32',
    S3_ACCESS_KEY_ID: `${canary}-access`,
    S3_SECRET_ACCESS_KEY: `${canary}-r2`,
    SMTP_USERNAME: 'api_token',
    SMTP_PASSWORD: `${canary}-smtp`,
    CLOUDFLARE_CACHE_TOKEN: `${canary}-cache`,
    ...overrides,
  };
}

function writeSecrets(payload, mode = 0o600, directory = tmpdir()) {
  const folder = mkdtempSync(join(directory, 'bidplace-secret-fixture-'));
  chmodSync(folder, 0o700);
  const file = join(folder, 'secrets.json');
  writeFileSync(file, JSON.stringify(payload), { mode });
  chmodSync(file, mode);
  return { folder, file };
}

test('production deploy rejects a non-release branch without printing credentials', () => {
  const result = spawnSync(process.execPath, [join(root, 'scripts/cloudflare/deploy.mjs'), 'production'], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH, WORKERS_CI_BRANCH: 'main', DATABASE_URL: canary },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /release branch/);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, new RegExp(canary));
});

test('gate environment removes runtime and deploy credentials', () => {
  const env = gateEnvironment({
    PATH: '/usr/bin', DATABASE_URL: canary, DATABASE_URL_UNPOOLED: canary, NEON_DIRECT_URL: canary,
    CLOUDFLARE_API_TOKEN: canary, SERVICE_RULES_OWNER: 'bidplace',
    SERVICE_RULES_CONTACT: 'work.evles@gmail.com', SERVICE_RULES_TEXT: 'approved rules',
    SMTP_PASSWORD: canary,
  });
  assert.equal(env.PATH, '/usr/bin');
  assert.equal(env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV, 'false');
  for (const name of [...requiredSecrets, 'DATABASE_URL_UNPOOLED', 'NEON_DIRECT_URL', 'CLOUDFLARE_API_TOKEN', 'SERVICE_RULES_OWNER', 'SERVICE_RULES_CONTACT', 'SERVICE_RULES_TEXT']) {
    assert.equal(env[name], undefined);
  }
});

test('secrets file accepts the runtime contract and rejects unsafe files without printing values', () => {
  const valid = writeSecrets(secrets());
  try { assertSecretsFile(valid.file, root); }
  finally { rmSync(valid.folder, { recursive: true, force: true }); }

  const cases = [
    [secrets({ DATABASE_URL: `postgresql://role:${canary}@ep-test.neon.tech/neondb?sslmode=require` }), /pooled hostname/],
    [secrets({ SMTP_USERNAME: 'other-user' }), /api_token/],
    [secrets({ JWT_SECRET: canary }), /JWT_SECRET must be at least/],
    [{ ...secrets(), DATABASE_URL_UNPOOLED: canary }, /runtime contract/],
    [{ ...secrets(), NEON_DIRECT_URL: canary }, /runtime contract/],
  ];
  for (const [payload, pattern] of cases) {
    const fixture = writeSecrets(payload);
    try {
      assert.throws(() => assertSecretsFile(fixture.file, root), (error) => {
        assert.match(error.message, pattern);
        assert.doesNotMatch(error.message, new RegExp(canary));
        return true;
      });
    } finally {
      rmSync(fixture.folder, { recursive: true, force: true });
    }
  }

  const readable = writeSecrets(secrets(), 0o644);
  try { assert.throws(() => assertSecretsFile(readable.file, root), /only by its owner/); }
  finally { rmSync(readable.folder, { recursive: true, force: true }); }

  const inside = writeSecrets(secrets(), 0o600, root);
  try { assert.throws(() => assertSecretsFile(inside.file, root), /outside the checkout/); }
  finally { rmSync(inside.folder, { recursive: true, force: true }); }

  const broken = writeSecrets(secrets());
  writeFileSync(broken.file, `not-json ${canary}`, { mode: 0o600 });
  try {
    assert.throws(() => assertSecretsFile(broken.file, root), (error) => {
      assert.match(error.message, /must be JSON/);
      assert.doesNotMatch(error.message, new RegExp(canary));
      return true;
    });
  } finally { rmSync(broken.folder, { recursive: true, force: true }); }
});

test('production config receives service rules from the caller and keeps the checkout empty', () => {
  const created = writeProductionConfig({
    owner: ' bidplace ',
    contact: ' work.evles@gmail.com ',
    text: '  Approved portfolio rules.  ',
  });
  try {
    const written = JSON.parse(readFileSync(created.file, 'utf8'));
    assert.equal(written.env.production.vars.SERVICE_RULES_OWNER, 'bidplace');
    assert.equal(written.env.production.vars.SERVICE_RULES_CONTACT, 'work.evles@gmail.com');
    assert.equal(written.env.production.vars.SERVICE_RULES_TEXT, 'Approved portfolio rules.');
    assert.equal(written.main, resolve(root, 'deploy/cloudflare/src/index.ts'));
    assert.equal(created.file.startsWith(`${root}/`), false);
    const committed = JSON.parse(readFileSync(resolve(root, 'deploy/cloudflare/wrangler.jsonc'), 'utf8'));
    assert.equal(committed.env.production.vars.SERVICE_RULES_OWNER, '');
    assert.equal(committed.env.production.vars.SERVICE_RULES_CONTACT, '');
    assert.equal(committed.env.production.vars.SERVICE_RULES_TEXT, '');
  } finally {
    rmSync(created.directory, { recursive: true, force: true });
  }
  assert.throws(() => writeProductionConfig({ owner: '', contact: 'ops@example.invalid', text: 'rules' }), /SERVICE_RULES_OWNER is required/);
  assert.throws(() => writeProductionConfig({ owner: 'bidplace', contact: ' ', text: 'rules' }), /SERVICE_RULES_CONTACT is required/);
  assert.throws(() => writeProductionConfig({ owner: 'bidplace', contact: 'ops@example.invalid', text: '   ' }), /SERVICE_RULES_TEXT is required/);
});
