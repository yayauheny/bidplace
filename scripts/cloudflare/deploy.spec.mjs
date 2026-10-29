import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import {
  workerSecrets,
  optionalContainerSettings,
} from '../../deploy/cloudflare/src/environment.ts';
import { containerReleaseReady } from '../../deploy/cloudflare/src/release-gate.ts';
import { root } from './config.mjs';
import {
  assertProductionReleaseMode,
  assertSecretsFile,
  gateEnvironment,
  productionWranglerArgs,
  writeProductionConfig,
} from './deploy.mjs';

const canary = 'local-secret-canary';

function secrets(overrides = {}) {
  return {
    DATABASE_URL: `postgresql://role:${canary}@ep-test-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`,
    SESSION_SECRET: 'local-secret-canary-session-value-32',
    OTP_HASH_SECRET: 'local-secret-canary-otp-value-at-least-32',
    S3_ACCESS_KEY_ID: `${canary}-access`,
    S3_SECRET_ACCESS_KEY: `${canary}-r2`,
    SMTP_USERNAME: 'api_token',
    SMTP_PASSWORD: `${canary}-smtp`,
    CLOUDFLARE_CACHE_TOKEN: `${canary}-cache`,
    TURNSTILE_SECRET_KEY: `${canary}-turnstile`,
    INTERNAL_TICK_SECRET: `${canary}-internal-tick`,
    RELEASE_CONTROL: `${canary}-release-control-value-32`,
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
  const result = spawnSync(
    process.execPath,
    [join(root, 'scripts/cloudflare/deploy.mjs'), 'production'],
    {
      encoding: 'utf8',
      env: {
        PATH: process.env.PATH,
        WORKERS_CI_BRANCH: 'main',
        DATABASE_URL: canary,
      },
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /release branch/);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, new RegExp(canary));
});

test('gate environment removes runtime and deploy credentials', () => {
  const env = gateEnvironment({
    ...Object.fromEntries(
      optionalContainerSettings.map((name) => [name, canary]),
    ),
    PATH: '/usr/bin',
    DATABASE_URL: canary,
    DATABASE_URL_UNPOOLED: canary,
    NEON_DIRECT_URL: canary,
    CLOUDFLARE_API_TOKEN: canary,
    SERVICE_RULES_OWNER: 'bidplace',
    SERVICE_RULES_CONTACT: 'work.evles@gmail.com',
    SERVICE_RULES_TEXT: 'approved rules',
    SMTP_PASSWORD: canary,
    RELEASE_CONTROL: canary,
    TURNSTILE_SITE_KEY: 'task-public-site-key',
    TURNSTILE_SECRET_KEY: canary,
  });
  assert.equal(env.PATH, '/usr/bin');
  assert.equal(env.TURNSTILE_SITE_KEY, 'task-public-site-key');
  assert.equal(env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV, 'false');
  for (const name of [
    ...workerSecrets,
    ...optionalContainerSettings,
    'DATABASE_URL_UNPOOLED',
    'NEON_DIRECT_URL',
    'CLOUDFLARE_API_TOKEN',
    'SERVICE_RULES_OWNER',
    'SERVICE_RULES_CONTACT',
    'SERVICE_RULES_TEXT',
  ]) {
    assert.equal(env[name], undefined);
  }
});

test('secrets file accepts the runtime contract and rejects unsafe files without printing values', () => {
  const valid = writeSecrets(
    secrets(
      Object.fromEntries(
        optionalContainerSettings.map((name) => [name, canary]),
      ),
    ),
  );
  try {
    assertSecretsFile(valid.file, root);
  } finally {
    rmSync(valid.folder, { recursive: true, force: true });
  }

  const cases = [
    [
      secrets({
        DATABASE_URL: `postgresql://role:${canary}@ep-test.neon.tech/neondb?sslmode=require`,
      }),
      /pooled hostname/,
    ],
    [secrets({ SMTP_USERNAME: 'other-user' }), /api_token/],
    [secrets({ SESSION_SECRET: canary }), /SESSION_SECRET must be at least/],
    [secrets({ OTP_HASH_SECRET: canary }), /OTP_HASH_SECRET must be at least/],
    [
      secrets({ GOOGLE_CLIENT_ID: canary }),
      /GOOGLE configuration must be complete/,
    ],
    [
      secrets({
        TELEGRAM_CLIENT_ID: canary,
        TELEGRAM_CLIENT_SECRET: canary,
        TELEGRAM_REDIRECT_URI: '',
      }),
      /TELEGRAM configuration must be complete/,
    ],
    [secrets({ RELEASE_CONTROL: canary }), /RELEASE_CONTROL must be at least/],
    [{ ...secrets(), DATABASE_URL_UNPOOLED: canary }, /runtime contract/],
    [{ ...secrets(), NEON_DIRECT_URL: canary }, /runtime contract/],
  ];
  for (const [payload, pattern] of cases) {
    const fixture = writeSecrets(payload);
    try {
      assert.throws(
        () => assertSecretsFile(fixture.file, root),
        (error) => {
          assert.match(error.message, pattern);
          assert.doesNotMatch(error.message, new RegExp(canary));
          return true;
        },
      );
    } finally {
      rmSync(fixture.folder, { recursive: true, force: true });
    }
  }

  const readable = writeSecrets(secrets(), 0o644);
  try {
    assert.throws(
      () => assertSecretsFile(readable.file, root),
      /only by its owner/,
    );
  } finally {
    rmSync(readable.folder, { recursive: true, force: true });
  }

  const inside = writeSecrets(secrets(), 0o600, root);
  try {
    assert.throws(
      () => assertSecretsFile(inside.file, root),
      /outside the checkout/,
    );
  } finally {
    rmSync(inside.folder, { recursive: true, force: true });
  }

  const broken = writeSecrets(secrets());
  writeFileSync(broken.file, `not-json ${canary}`, { mode: 0o600 });
  try {
    assert.throws(
      () => assertSecretsFile(broken.file, root),
      (error) => {
        assert.match(error.message, /must be JSON/);
        assert.doesNotMatch(error.message, new RegExp(canary));
        return true;
      },
    );
  } finally {
    rmSync(broken.folder, { recursive: true, force: true });
  }
});

test('opening requires the published container image, not a Worker var', () => {
  const versionId = '4b41ca7f-3eb5-4849-83f8-e045bc016cff';
  const ready = {
    publicApiStatus: 503,
    deployment: {
      created_on: '2026-10-08T10:00:00.000Z',
      versions: [{ version_id: versionId, percentage: 100 }],
    },
    images: [
      {
        name: 'bidplace-production-portfolioapi-production',
        tags: ['4b41ca7f'],
      },
    ],
    listed: {
      name: 'bidplace-production-portfolioapi-production',
      state: 'ready',
    },
    info: {
      name: 'bidplace-production-portfolioapi-production',
      updated_at: '2026-10-08T10:01:00.000Z',
      configuration: {
        image:
          'registry.example/account/bidplace-production-portfolioapi-production@sha256:abc',
      },
    },
  };
  assert.equal(containerReleaseReady(ready), true);
  assert.equal(
    containerReleaseReady({
      ...ready,
      listed: { ...ready.listed, state: 'active' },
    }),
    true,
  );
  assert.equal(
    containerReleaseReady({
      ...ready,
      images: [{ name: ready.images[0].name, tags: ['08ecae5a'] }],
    }),
    false,
  );
  assert.equal(
    containerReleaseReady({
      ...ready,
      info: { ...ready.info, updated_at: '2026-10-08T09:59:00.000Z' },
    }),
    false,
  );
  assert.equal(
    containerReleaseReady({
      ...ready,
      info: { ...ready.info, active_rollout_id: 'rollout' },
    }),
    false,
  );
  assert.equal(
    containerReleaseReady({
      ...ready,
      listed: { ...ready.listed, state: 'provisioning' },
    }),
    false,
  );
  assert.equal(
    containerReleaseReady({ ...ready, publicApiStatus: 200 }),
    false,
  );
});

test('release commands keep the previous API image until the closed image deploy', () => {
  const sha = 'a'.repeat(40);
  const kept = productionWranglerArgs({
    configFile: '/tmp/wrangler.json',
    secretsFile: '/tmp/secrets.json',
    release: 'closed',
    keepContainer: true,
    keepHold: false,
    releaseId: sha,
  });
  assert.equal(kept.skipImage, true);
  assert.ok(kept.args.includes('--containers-rollout'));
  assert.equal(
    kept.args[kept.args.indexOf('--containers-rollout') + 1],
    'none',
  );
  assert.ok(kept.args.includes('--keep-vars'));
  assert.ok(kept.args.includes('RELEASE_HOLD:closed'));
  assert.equal(
    kept.args.some((arg) => arg.startsWith('RELEASE_IMAGE:')),
    false,
  );
  const image = productionWranglerArgs({
    configFile: '/tmp/wrangler.json',
    secretsFile: '/tmp/secrets.json',
    release: 'closed',
    keepContainer: false,
    keepHold: false,
    releaseId: sha,
  });
  assert.equal(image.skipImage, false);
  assert.equal(image.args.includes('--containers-rollout'), false);
  assert.equal(
    image.args.some((arg) => arg.startsWith('RELEASE_IMAGE:')),
    false,
  );
  const open = productionWranglerArgs({
    configFile: '/tmp/wrangler.json',
    secretsFile: '/tmp/secrets.json',
    release: 'open',
    keepContainer: false,
    keepHold: false,
  });
  assert.equal(open.skipImage, true);
  assert.ok(open.args.includes('RELEASE_HOLD:open'));
  assert.equal(open.args.includes('RELEASE_IMAGE:current'), false);
  assert.throws(
    () =>
      productionWranglerArgs({
        configFile: '/tmp/wrangler.json',
        secretsFile: '/tmp/secrets.json',
        release: 'open',
        keepContainer: true,
        keepHold: false,
      }),
    /--keep-container requires --release closed/,
  );
  assert.throws(
    () =>
      assertProductionReleaseMode({
        release: undefined,
        keepContainer: false,
        keepHold: false,
      }),
    /requires --release closed/,
  );
  const keptHold = productionWranglerArgs({
    configFile: '/tmp/wrangler.json',
    secretsFile: '/tmp/secrets.json',
    keepContainer: false,
    keepHold: true,
  });
  assert.equal(keptHold.skipImage, false);
  assert.equal(keptHold.args.includes('RELEASE_HOLD:open'), false);
  assert.equal(keptHold.args.includes('RELEASE_HOLD:closed'), false);
  assert.ok(keptHold.args.includes('--keep-vars'));
});

test('production config receives service rules from the caller and keeps the checkout empty', () => {
  const created = writeProductionConfig({
    owner: ' bidplace ',
    contact: ' work.evles@gmail.com ',
    text: '  Approved portfolio rules.  ',
  });
  try {
    const written = JSON.parse(readFileSync(created.file, 'utf8'));
    assert.deepEqual(written.env.production.triggers, { crons: [] });
    assert.equal(written.env.production.vars.TICK_CRON, '');
    assert.equal(written.env.production.vars.SERVICE_RULES_OWNER, 'bidplace');
    assert.equal(
      written.env.production.vars.SERVICE_RULES_CONTACT,
      'work.evles@gmail.com',
    );
    assert.equal(
      written.env.production.vars.SERVICE_RULES_TEXT,
      'Approved portfolio rules.',
    );
    assert.equal(written.main, resolve(root, 'deploy/cloudflare/src/index.ts'));
    assert.equal(created.file.startsWith(`${root}/`), false);
    const committed = JSON.parse(
      readFileSync(resolve(root, 'deploy/cloudflare/wrangler.jsonc'), 'utf8'),
    );
    assert.equal(committed.env.production.vars.SERVICE_RULES_OWNER, '');
    assert.equal(committed.env.production.vars.SERVICE_RULES_CONTACT, '');
    assert.equal(committed.env.production.vars.SERVICE_RULES_TEXT, '');
  } finally {
    rmSync(created.directory, { recursive: true, force: true });
  }
  assert.throws(
    () =>
      writeProductionConfig({
        owner: '',
        contact: 'ops@example.invalid',
        text: 'rules',
      }),
    /SERVICE_RULES_OWNER is required/,
  );
  assert.throws(
    () =>
      writeProductionConfig({ owner: 'bidplace', contact: ' ', text: 'rules' }),
    /SERVICE_RULES_CONTACT is required/,
  );
  assert.throws(
    () =>
      writeProductionConfig({
        owner: 'bidplace',
        contact: 'ops@example.invalid',
        text: '   ',
      }),
    /SERVICE_RULES_TEXT is required/,
  );
});

function workflowStep(workflow, title) {
  const marker = `- name: ${title}\n`;
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1);
  const next = workflow.indexOf('\n      - name: ', start + marker.length);
  return workflow.slice(start, next === -1 ? undefined : next);
}

function secretBindings(step) {
  const names = [];
  for (const line of step.split('\n')) {
    const match = line.match(
      /^ +([A-Z][A-Z0-9_]*): \$\{\{ secrets\.([A-Z][A-Z0-9_]*) \}\}$/,
    );
    if (!match) continue;
    assert.equal(match[1], match[2]);
    names.push(match[1]);
  }
  return names;
}

function embeddedPython(step) {
  const header = "python3 - <<'PY'\n";
  const start = step.indexOf(header);
  assert.notEqual(start, -1);
  const rest = step.slice(start + header.length);
  const end = rest.search(/\n *PY\n/);
  assert.notEqual(end, -1);
  const lines = rest.slice(0, end).split('\n');
  const indent = Math.min(
    ...lines
      .filter((line) => line.trim())
      .map((line) => line.match(/^ */)[0].length),
  );
  return `${lines.map((line) => line.slice(indent)).join('\n')}\n`;
}

function runPython(script, env) {
  return spawnSync('python3', ['-'], {
    encoding: 'utf8',
    input: script,
    env: { PATH: process.env.PATH ?? '', ...env },
  });
}

function missingNames(result, prefix) {
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  const message = result.stderr.trim();
  assert.equal(message.startsWith(prefix), true);
  assert.equal(result.stdout, '');
  return message.slice(prefix.length).split(', ').filter(Boolean);
}

test('production workflow validation and secrets payload stay aligned with worker secrets', () => {
  const workflow = readFileSync(
    resolve(root, '.github/workflows/production-deploy.yml'),
    'utf8',
  );
  const verifyStep = workflowStep(workflow, 'Verify production settings');
  const deployStep = workflowStep(workflow, 'Deploy production');
  assert.match(deployStep, /TICK_CRON: \$\{\{ vars\.TICK_CRON \}\}/);
  const verifyPy = embeddedPython(verifyStep);
  const deployPy = embeddedPython(deployStep);
  const verifyBindings = secretBindings(verifyStep);
  const deployBindings = secretBindings(deployStep);
  const spaBindings = secretBindings(
    workflowStep(workflow, 'Build the production SPA'),
  );
  assert.deepEqual(spaBindings, ['TURNSTILE_SITE_KEY']);
  assert.equal(deployBindings.includes('TURNSTILE_SITE_KEY'), true);
  const folder = mkdtempSync(join(tmpdir(), 'bidplace-workflow-secrets-'));
  chmodSync(folder, 0o700);
  const file = join(folder, 'secrets.json');
  const canary = 'workflow-secret-canary-value-32';
  const quiet = (result) =>
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, new RegExp(canary));
  try {
    const verifyRequired = missingNames(
      runPython(verifyPy, {}),
      'Missing production settings: ',
    );
    const deployRequired = missingNames(
      runPython(deployPy, { SECRETS_FILE: file }),
      'Missing deployment secret names: ',
    );
    assert.equal(workerSecrets.includes('TURNSTILE_SITE_KEY'), false);
    assert.equal(deployRequired.includes('TURNSTILE_SITE_KEY'), false);
    assert.equal(verifyRequired.includes('TURNSTILE_SECRET_KEY'), true);
    for (const name of deployRequired) {
      assert.equal(workerSecrets.includes(name), true);
      assert.equal(verifyRequired.includes(name), true);
      assert.equal(verifyBindings.includes(name), true);
      assert.equal(deployBindings.includes(name), true);
    }

    const endpoint = verifyPy.match(/^expected = "([^"]+)"$/m);
    assert.ok(endpoint);
    const neonUrl = (pooled) => {
      const host = pooled
        ? `${endpoint[1]}-pooler.neon.tech`
        : `${endpoint[1]}.neon.tech`;
      return `postgresql://role:${canary}@${host}/neondb?sslmode=require`;
    };
    const pooledDatabaseUrl = neonUrl(true);
    const directDatabaseUrl = neonUrl(false);
    const verifyEnv = {};
    for (const name of verifyRequired) {
      if (name === 'DATABASE_URL') verifyEnv[name] = pooledDatabaseUrl;
      else if (name === 'NEON_DIRECT_URL') verifyEnv[name] = directDatabaseUrl;
      else verifyEnv[name] = `${canary}-${name}`;
    }
    const verified = runPython(verifyPy, verifyEnv);
    quiet(verified);
    assert.equal(verified.status, 0);

    const deployEnv = { SECRETS_FILE: file };
    for (const name of deployRequired) {
      deployEnv[name] =
        name === 'DATABASE_URL'
          ? pooledDatabaseUrl
          : `${canary}-${name}-padding`;
    }
    const deployed = runPython(deployPy, deployEnv);
    quiet(deployed);
    assert.equal(deployed.status, 0);
    assert.deepEqual(
      Object.keys(JSON.parse(readFileSync(file, 'utf8'))).sort(),
      [...workerSecrets].sort(),
    );
    assertSecretsFile(file, root);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test('production config sends an enabled tick schedule to Wrangler', () => {
  const created = writeProductionConfig({ owner: 'test', contact: 'ops@example.invalid', text: 'rules' }, '*/5 * * * *');
  try {
    const config = JSON.parse(readFileSync(created.file, 'utf8')).env.production;
    assert.deepEqual(config.triggers, { crons: ['*/5 * * * *'] });
    assert.equal(config.vars.TICK_CRON, '*/5 * * * *');
  } finally {
    rmSync(created.directory, { recursive: true, force: true });
  }
});
