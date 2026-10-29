import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  workerSecrets,
  optionalContainerSettings,
} from '../../deploy/cloudflare/src/environment.ts';
import {
  containerReleaseReady,
  databaseGuardFailure,
  nicknameGateSql,
} from '../../deploy/cloudflare/src/release-gate.ts';
import {
  configPath,
  configureTickSchedule,
  deploymentConfig,
  root,
  validateConfig,
} from './config.mjs';

const RELEASE_BRANCH = 'main';
const PRODUCTION_SESSION_SECRET_MIN_LENGTH = 32;
const GATE_ONLY_ENV = [
  ...workerSecrets,
  ...optionalContainerSettings,
  'DATABASE_URL_UNPOOLED',
  'NEON_DIRECT_URL',
  'CLOUDFLARE_API_TOKEN',
  'SERVICE_RULES_OWNER',
  'SERVICE_RULES_CONTACT',
  'SERVICE_RULES_TEXT',
];

export function assertReleaseBranch(branch) {
  if (branch !== RELEASE_BRANCH)
    throw new Error('Production deploy requires the release branch');
}

export function assertRulesText(text) {
  if (typeof text !== 'string' || !text.trim())
    throw new Error('SERVICE_RULES_TEXT is required');
  return text.trim();
}

export function assertRuleValue(name, value) {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`${name} is required`);
  return value.trim();
}

export function gateEnvironment(env) {
  const next = { ...env, CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false' };
  for (const name of GATE_ONLY_ENV) delete next[name];
  return next;
}

export function assertSecretsFile(file, checkoutRoot) {
  if (typeof file !== 'string' || !isAbsolute(file)) {
    throw new Error(
      'Secrets file must be an absolute path outside the checkout',
    );
  }
  const fromCheckout = relative(checkoutRoot, file);
  if (
    fromCheckout === '' ||
    (!fromCheckout.startsWith('..') && !isAbsolute(fromCheckout))
  ) {
    throw new Error('Secrets file must be outside the checkout');
  }
  let info;
  try {
    info = statSync(file);
  } catch {
    throw new Error('Secrets file is not readable; contents are not logged');
  }
  if ((info.mode & 0o077) !== 0)
    throw new Error('Secrets file must be readable only by its owner');
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    throw new Error('Secrets file must be JSON; contents are not logged');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(
      'Secrets file must be a JSON object; contents are not logged',
    );
  }
  const keys = Object.keys(parsed)
    .filter((key) => !optionalContainerSettings.includes(key))
    .sort();
  const expected = [...workerSecrets].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    throw new Error(
      'Secrets file keys must match the runtime contract; values are not logged',
    );
  }
  for (const key of expected) {
    if (typeof parsed[key] !== 'string' || !parsed[key].trim()) {
      throw new Error(`Secrets file is missing ${key}; value is not logged`);
    }
  }
  if (parsed.SMTP_USERNAME !== 'api_token') {
    throw new Error('SMTP_USERNAME must be the Cloudflare literal api_token');
  }
  if (parsed.SESSION_SECRET.length < PRODUCTION_SESSION_SECRET_MIN_LENGTH) {
    throw new Error(
      `SESSION_SECRET must be at least ${PRODUCTION_SESSION_SECRET_MIN_LENGTH} characters`,
    );
  }
  for (const name of ['OTP_HASH_SECRET', 'INTERNAL_TICK_SECRET']) {
    if (parsed[name].length < 32)
      throw new Error(`${name} must be at least 32 characters`);
  }
  for (const provider of ['GOOGLE', 'TELEGRAM']) {
    const names = optionalContainerSettings.filter((name) =>
      name.startsWith(provider),
    );
    const configured = names.filter((name) => parsed[name] !== undefined);
    if (
      configured.length &&
      (configured.length !== names.length ||
        configured.some(
          (name) => typeof parsed[name] !== 'string' || !parsed[name].trim(),
        ))
    )
      throw new Error(`${provider} configuration must be complete`);
  }
  if (parsed.RELEASE_CONTROL.length < PRODUCTION_SESSION_SECRET_MIN_LENGTH) {
    throw new Error(
      `RELEASE_CONTROL must be at least ${PRODUCTION_SESSION_SECRET_MIN_LENGTH} characters`,
    );
  }
  let database;
  try {
    database = new URL(parsed.DATABASE_URL);
  } catch {
    throw new Error('Runtime DATABASE_URL is invalid; value is not logged');
  }
  if (
    !database.hostname.endsWith('.neon.tech') ||
    !database.hostname.split('.')[0].endsWith('-pooler')
  ) {
    throw new Error('Runtime DATABASE_URL must use the Neon pooled hostname');
  }
}

export function writeProductionConfig(rules, tickCron = process.env.TICK_CRON) {
  const owner = assertRuleValue('SERVICE_RULES_OWNER', rules?.owner);
  const contact = assertRuleValue('SERVICE_RULES_CONTACT', rules?.contact);
  const text = assertRulesText(rules?.text);
  const full = JSON.parse(readFileSync(configPath, 'utf8'));
  full.env.production.vars.SERVICE_RULES_OWNER = owner;
  full.env.production.vars.SERVICE_RULES_CONTACT = contact;
  full.env.production.vars.SERVICE_RULES_TEXT = text;
  configureTickSchedule(full.env.production, tickCron);
  // Wrangler preserves deployed schedules when triggers are omitted.
  full.env.production.triggers ??= { crons: [] };
  validateConfig(full.env.production);
  const base = dirname(configPath);
  full.main = resolve(base, full.main);
  full.assets.directory = resolve(base, full.assets.directory);
  delete full.$schema;
  for (const environment of Object.values(full.env)) {
    for (const container of environment.containers ?? []) {
      container.image = resolve(base, container.image);
      container.image_build_context = resolve(
        base,
        container.image_build_context,
      );
    }
  }
  const directory = mkdtempSync(join(tmpdir(), 'bidplace-wrangler-'));
  chmodSync(directory, 0o700);
  const file = join(directory, 'wrangler.json');
  writeFileSync(file, JSON.stringify(full), { mode: 0o600 });
  return { directory, file };
}

export function assertProductionReleaseMode({
  release,
  keepContainer,
  keepHold,
}) {
  if (release !== undefined && release !== 'closed' && release !== 'open') {
    throw new Error('--release requires closed or open');
  }
  if (keepContainer && release !== 'closed')
    throw new Error('--keep-container requires --release closed');
  if (keepHold && release)
    throw new Error('--keep-hold cannot change the release hold');
  if (!release && !keepHold) {
    throw new Error(
      'Production deploy requires --release closed, --release open, or --keep-hold',
    );
  }
}

export function productionWranglerArgs({
  configFile,
  secretsFile,
  release,
  keepContainer,
  keepHold,
  releaseId,
}) {
  assertProductionReleaseMode({ release, keepContainer, keepHold });
  const preserveImage = keepContainer || release === 'open';
  const args = [
    'deploy',
    '--config',
    configFile,
    '--env',
    'production',
    '--secrets-file',
    secretsFile,
    '--keep-vars',
  ];
  if (release) args.push('--var', `RELEASE_HOLD:${release}`);
  if (release === 'closed' && releaseId)
    args.push('--var', `RELEASE_ID:${releaseId}`);
  if (preserveImage) args.push('--containers-rollout', 'none');
  return { args, skipImage: preserveImage };
}

export function assertReleaseSha(releaseId) {
  if (!/^[0-9a-f]{40}$/.test(releaseId))
    throw new Error('Release id must be the 40-character commit SHA');
  return releaseId;
}

export function runDirectSql(sql, databaseUrl) {
  let database;
  try {
    database = new URL(databaseUrl);
  } catch {
    throw new Error('Direct database URL is invalid; value is not logged');
  }
  if (
    !['postgres:', 'postgresql:'].includes(database.protocol) ||
    !database.hostname?.endsWith('.neon.tech') ||
    database.searchParams.get('sslmode') !== 'require' ||
    database.hostname.split('.')[0].endsWith('-pooler')
  ) {
    throw new Error(
      'Direct database URL must be the non-pooled Neon hostname; value is not logged',
    );
  }
  const result = spawnSync(
    process.execPath,
    [
      join(root, 'packages/database/node_modules/prisma/build/index.js'),
      'db',
      'execute',
      '--stdin',
      '--schema',
      join(root, 'packages/database/prisma/schema.prisma'),
    ],
    {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      input: sql,
      encoding: 'utf8',
    },
  );
  if (result.error || result.status !== 0) {
    const failure = databaseGuardFailure(
      `${result.stdout ?? ''}${result.stderr ?? ''}`,
    );
    if (failure === 'sessions')
      throw new Error(
        'Migration refused because other database sessions can still commit',
      );
    if (failure === 'nicknames')
      throw new Error(
        'Opening access refused because account and profile nicknames differ',
      );
    if (failure === 'migration')
      throw new Error(
        'Opening access refused because the slug migration is not recorded',
      );
    throw new Error('Database guard failed; inspect on a trusted machine');
  }
}

function wranglerJson(configFile, args) {
  const result = spawnSync(
    'pnpm',
    [
      'exec',
      'wrangler',
      ...args,
      '--config',
      configFile,
      '--env',
      'production',
      '--json',
    ],
    {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, CI: '1' },
    },
  );
  if (result.status !== 0)
    throw new Error(
      'Opening access refused: container publication could not be read',
    );
  const start = result.stdout.indexOf(
    result.stdout.trimStart().startsWith('[') ? '[' : '{',
  );
  try {
    return JSON.parse(start === -1 ? '' : result.stdout.slice(start));
  } catch {
    throw new Error(
      'Opening access refused: container publication could not be read',
    );
  }
}

function assertClosedRelease(releaseId, configFile) {
  const control = process.env.RELEASE_CONTROL ?? '';
  if (control.length < 32)
    throw new Error(
      'Opening access requires RELEASE_CONTROL; value is not logged',
    );
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    const headers = { Authorization: 'Bearer ' + process.env.RELEASE_CONTROL };
    const api = await fetch('https://bid.place/api');
    const stateResponse = await fetch('https://bid.place/_release/state', { headers });
    let state = {};
    try { state = await stateResponse.json(); } catch { state = {}; }
    if (api.status !== 503 || api.headers.get('cache-control') !== 'no-store' ||
        stateResponse.status !== 200 || state.releaseId !== process.env.EXPECTED_RELEASE_ID) {
      process.exit(2);
    }
    process.stdout.write(String(api.status));
  `,
    ],
    {
      env: {
        PATH: process.env.PATH,
        RELEASE_CONTROL: control,
        EXPECTED_RELEASE_ID: releaseId,
      },
      encoding: 'utf8',
    },
  );
  if (result.status !== 0) {
    throw new Error(
      'Opening access refused: the closed release does not match this commit',
    );
  }
  const deployment = wranglerJson(configFile, ['deployments', 'status']);
  const listed = wranglerJson(configFile, ['containers', 'list']);
  const application = listed.find(
    (item) => item.name === 'bidplace-production-portfolioapi-production',
  );
  if (!application?.id)
    throw new Error(
      'Opening access refused: the published container image is not ready',
    );
  const info = wranglerJson(configFile, ['containers', 'info', application.id]);
  const images = wranglerJson(configFile, ['containers', 'images', 'list']);
  if (
    !containerReleaseReady({
      publicApiStatus: Number(result.stdout),
      deployment,
      images,
      listed: application,
      info,
    })
  ) {
    throw new Error(
      'Opening access refused: the published container image is not ready',
    );
  }
}

function argumentValue(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--'))
    throw new Error(`${name} requires a path`);
  return value;
}

function main() {
  const args = process.argv.slice(2);
  const target = args.find((arg) => !arg.startsWith('--'));
  deploymentConfig(target);
  const branch =
    process.env.WORKERS_CI_BRANCH ??
    execFileSync('git', ['branch', '--show-current'], {
      cwd: root,
      encoding: 'utf8',
    }).trim();
  assertReleaseBranch(branch);
  const status = execFileSync(
    'git',
    ['-c', 'core.fsmonitor=false', 'status', '--porcelain'],
    {
      cwd: root,
      encoding: 'utf8',
    },
  );
  if (status.trim())
    throw new Error('Production deploy requires a clean release checkout');
  const secretsFile = argumentValue(args, '--secrets-file');
  if (!secretsFile)
    throw new Error('Production deploy requires --secrets-file');
  const rules = {
    owner: process.env.SERVICE_RULES_OWNER,
    contact: process.env.SERVICE_RULES_CONTACT,
    text: process.env.SERVICE_RULES_TEXT,
  };
  assertRuleValue('SERVICE_RULES_OWNER', rules.owner);
  assertRuleValue('SERVICE_RULES_CONTACT', rules.contact);
  assertRulesText(rules.text);
  assertSecretsFile(secretsFile, root);
  if (!process.env.CLOUDFLARE_API_TOKEN?.trim())
    throw new Error('CLOUDFLARE_API_TOKEN is required');
  const release = argumentValue(args, '--release');
  const keepContainer = args.includes('--keep-container');
  const keepHold = args.includes('--keep-hold');
  const releaseId =
    release === 'closed' || release === 'open'
      ? assertReleaseSha(
          execFileSync('git', ['rev-parse', 'HEAD'], {
            cwd: root,
            encoding: 'utf8',
          }).trim(),
        )
      : undefined;
  const gates = gateEnvironment(process.env);
  const { directory, file } = writeProductionConfig(rules);
  const wrangler = productionWranglerArgs({
    configFile: file,
    secretsFile,
    release,
    keepContainer,
    keepHold,
    releaseId,
  });
  try {
    if (release === 'open') {
      if (!process.env.NEON_DIRECT_URL?.trim())
        throw new Error(
          'Opening access requires NEON_DIRECT_URL; value is not logged',
        );
      assertClosedRelease(releaseId, file);
      runDirectSql(nicknameGateSql, process.env.NEON_DIRECT_URL);
    }
    execFileSync('pnpm', ['cloudflare:check'], {
      cwd: root,
      stdio: 'inherit',
      env: gates,
    });
    execFileSync('node', ['scripts/cloudflare/build-web.mjs', target], {
      cwd: root,
      stdio: 'inherit',
      env: gates,
    });
    if (!wrangler.skipImage) {
      execFileSync('pnpm', ['cloudflare:image:verify'], {
        cwd: root,
        stdio: 'inherit',
        env: gates,
      });
    }
    execFileSync('pnpm', ['exec', 'wrangler', ...wrangler.args], {
      cwd: root,
      stdio: 'inherit',
      env: {
        ...gates,
        CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
      },
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main();
