import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requiredSecrets } from '../../deploy/cloudflare/src/environment.ts';
import { configPath, deploymentConfig, root, validateConfig } from './config.mjs';

const RELEASE_BRANCH = 'feature/portfolio-mvp-release';
const PRODUCTION_JWT_SECRET_MIN_LENGTH = 32;
const GATE_ONLY_ENV = [...requiredSecrets, 'DATABASE_URL_UNPOOLED', 'CLOUDFLARE_API_TOKEN', 'SERVICE_RULES_TEXT'];

export function assertReleaseBranch(branch) {
  if (branch !== RELEASE_BRANCH) throw new Error('Production deploy requires the release branch');
}

export function assertRulesText(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('SERVICE_RULES_TEXT is required');
  return text.trim();
}

export function gateEnvironment(env) {
  const next = { ...env, CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false' };
  for (const name of GATE_ONLY_ENV) delete next[name];
  return next;
}

export function assertSecretsFile(file, checkoutRoot) {
  if (typeof file !== 'string' || !isAbsolute(file)) {
    throw new Error('Secrets file must be an absolute path outside the checkout');
  }
  const fromCheckout = relative(checkoutRoot, file);
  if (fromCheckout === '' || (!fromCheckout.startsWith('..') && !isAbsolute(fromCheckout))) {
    throw new Error('Secrets file must be outside the checkout');
  }
  let info;
  try { info = statSync(file); }
  catch { throw new Error('Secrets file is not readable; contents are not logged'); }
  if ((info.mode & 0o077) !== 0) throw new Error('Secrets file must be readable only by its owner');
  let parsed;
  try { parsed = JSON.parse(readFileSync(file, 'utf8')); }
  catch { throw new Error('Secrets file must be JSON; contents are not logged'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Secrets file must be a JSON object; contents are not logged');
  }
  const keys = Object.keys(parsed).sort();
  const expected = [...requiredSecrets].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    throw new Error('Secrets file keys must match the runtime contract; values are not logged');
  }
  for (const key of expected) {
    if (typeof parsed[key] !== 'string' || !parsed[key].trim()) {
      throw new Error(`Secrets file is missing ${key}; value is not logged`);
    }
  }
  if (parsed.SMTP_USERNAME !== 'api_token') {
    throw new Error('SMTP_USERNAME must be the Cloudflare literal api_token');
  }
  if (parsed.JWT_SECRET.length < PRODUCTION_JWT_SECRET_MIN_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${PRODUCTION_JWT_SECRET_MIN_LENGTH} characters`);
  }
  let database;
  try { database = new URL(parsed.DATABASE_URL); }
  catch { throw new Error('Runtime DATABASE_URL is invalid; value is not logged'); }
  if (!database.hostname.endsWith('.neon.tech') || !database.hostname.split('.')[0].endsWith('-pooler')) {
    throw new Error('Runtime DATABASE_URL must use the Neon pooled hostname');
  }
}

export function writeProductionConfig(rulesText) {
  const text = assertRulesText(rulesText);
  const full = JSON.parse(readFileSync(configPath, 'utf8'));
  full.env.production.vars.SERVICE_RULES_TEXT = text;
  validateConfig(full.env.production);
  const base = dirname(configPath);
  full.main = resolve(base, full.main);
  full.assets.directory = resolve(base, full.assets.directory);
  delete full.$schema;
  for (const environment of Object.values(full.env)) {
    for (const container of environment.containers ?? []) {
      container.image = resolve(base, container.image);
      container.image_build_context = resolve(base, container.image_build_context);
    }
  }
  const directory = mkdtempSync(join(tmpdir(), 'bidplace-wrangler-'));
  chmodSync(directory, 0o700);
  const file = join(directory, 'wrangler.json');
  writeFileSync(file, JSON.stringify(full), { mode: 0o600 });
  return { directory, file };
}

function argumentValue(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a path`);
  return value;
}

function main() {
  const args = process.argv.slice(2);
  const target = args.find((arg) => !arg.startsWith('--'));
  const config = deploymentConfig(target);
  if (target === 'production') {
    const branch = process.env.WORKERS_CI_BRANCH ??
      execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim();
    assertReleaseBranch(branch);
    const status = execFileSync('git', ['-c', 'core.fsmonitor=false', 'status', '--porcelain'], {
      cwd: root, encoding: 'utf8',
    });
    if (status.trim()) throw new Error('Production deploy requires a clean release checkout');
    const secretsFile = argumentValue(args, '--secrets-file');
    if (!secretsFile) throw new Error('Production deploy requires --secrets-file');
    assertRulesText(process.env.SERVICE_RULES_TEXT);
    assertSecretsFile(secretsFile, root);
    if (!process.env.CLOUDFLARE_API_TOKEN?.trim()) throw new Error('CLOUDFLARE_API_TOKEN is required');
    const gates = gateEnvironment(process.env);
    const { directory, file } = writeProductionConfig(process.env.SERVICE_RULES_TEXT);
    try {
      execFileSync('pnpm', ['cloudflare:check'], { cwd: root, stdio: 'inherit', env: gates });
      execFileSync('node', ['scripts/cloudflare/build-web.mjs', target], { cwd: root, stdio: 'inherit', env: gates });
      execFileSync('pnpm', ['cloudflare:image:verify'], { cwd: root, stdio: 'inherit', env: gates });
      execFileSync('pnpm', ['exec', 'wrangler', 'deploy', '--config', file, '--env', target, '--secrets-file', secretsFile], {
        cwd: root, stdio: 'inherit',
        env: { ...gates, CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN },
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
    return;
  }
  validateConfig(config);
  execFileSync('pnpm', ['cloudflare:check'], { cwd: root, stdio: 'inherit' });
  execFileSync('node', ['scripts/cloudflare/build-web.mjs', target], { cwd: root, stdio: 'inherit' });
  execFileSync('pnpm', ['cloudflare:image:verify'], { cwd: root, stdio: 'inherit' });
  execFileSync('pnpm', ['exec', 'wrangler', 'deploy', '--config', configPath, '--env', target], {
    cwd: root, stdio: 'inherit',
    env: { ...process.env, CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false' },
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
