import { defineConfig } from '@playwright/test';

const BLOCKED_TASK_DATABASES = new Set([
  'postgres',
  'template0',
  'template1',
  'bidplace',
  'bidplace_e2e',
]);

// Dedicated auth browser suite. It does not start API, Expo, Prisma, the
// cookie proxy, or read an env file. The caller owns those processes and the
// fresh auth_browser_* database. Default `test:e2e` keeps the disposable-db
// gate and does not include apps/mobile/e2e/auth-abuse.spec.ts.

const webBaseURL = requiredLoopbackURL('E2E_WEB_BASE_URL');
const apiBaseURL = requiredLoopbackURL('E2E_API_BASE_URL');
const databaseURL = requiredTaskDatabase(process.env.E2E_DATABASE_URL);
const mailPath = requiredAbsolutePath('E2E_TEST_EMAIL_FILE');
const evidenceDir = requiredAbsolutePath('E2E_EVIDENCE_DIR');
const proxyPort = requiredPort('E2E_AUTH_COOKIE_PROXY_PORT');
const controlPort = requiredPort('E2E_AUTH_COOKIE_PROXY_CONTROL_PORT');

if (mailPath.endsWith('/apps/mobile/e2e/.email.jsonl') || mailPath.endsWith('/e2e/.email.jsonl')) {
  throw new Error('Task mail must not use the ignored e2e mailbox');
}
if (apiBaseURL.port !== proxyPort) {
  throw new Error('E2E_API_BASE_URL must be the auth cookie proxy listen port');
}
if (controlPort === proxyPort) {
  throw new Error('Auth cookie proxy control port must be separate');
}

process.env.E2E_WEB_BASE_URL = webBaseURL.origin;
process.env.E2E_API_BASE_URL = apiBaseURL.origin;
process.env.E2E_DATABASE_URL = databaseURL;
process.env.E2E_TEST_EMAIL_FILE = mailPath;
process.env.TEST_EMAIL_FILE = mailPath;
process.env.E2E_EVIDENCE_DIR = evidenceDir;
process.env.E2E_AUTH_COOKIE_PROXY_PORT = proxyPort;
process.env.E2E_AUTH_COOKIE_PROXY_CONTROL_PORT = controlPort;
process.env.E2E_REDACT_AUTH_ARTIFACTS = '1';

export default defineConfig({
  testDir: './e2e',
  testMatch: [
    'auth-lifecycle.spec.ts',
    'auth-layout.spec.ts',
    'auth-abuse.spec.ts',
  ],
  timeout: 60_000,
  workers: 1,
  outputDir: './test-results/auth-abuse',
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  use: {
    baseURL: webBaseURL.origin,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});

function requiredLoopbackURL(name: string): URL {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute URL`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${name} must be http(s)`);
  }
  if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
    throw new Error(`${name} must stay on loopback`);
  }
  if (!url.port) throw new Error(`${name} must include a port`);
  if (url.username || url.password) throw new Error(`${name} must not include credentials`);
  if (url.pathname !== '/' && url.pathname !== '') throw new Error(`${name} must be an origin`);
  if (url.search) throw new Error(`${name} must not include a query`);
  if (url.hash) throw new Error(`${name} must not include a hash`);
  return url;
}

function requiredPort(name: string): string {
  const value = process.env[name]?.trim() ?? '';
  if (!/^\d+$/.test(value)) throw new Error(`${name} is required`);
  const port = Number(value);
  if (port < 1 || port > 65535) throw new Error(`${name} is invalid`);
  return value;
}

function requiredAbsolutePath(name: string): string {
  const value = process.env[name]?.trim() ?? '';
  if (!value.startsWith('/')) throw new Error(`${name} must be an absolute path`);
  return value;
}

function requiredTaskDatabase(value: string | undefined): string {
  if (!value?.trim()) throw new Error('E2E_DATABASE_URL is required');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('E2E_DATABASE_URL is invalid');
  }
  if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
    throw new Error('E2E_DATABASE_URL must stay on loopback');
  }
  if (!url.port || url.port === '5432') {
    throw new Error('E2E_DATABASE_URL must use a caller-owned port other than 5432');
  }
  const database = url.pathname.replace(/^\//, '');
  if (!/^[a-z0-9_]+$/.test(database) || BLOCKED_TASK_DATABASES.has(database)) {
    throw new Error('E2E_DATABASE_URL must name a caller-owned task database');
  }
  const schema = url.searchParams.get('schema');
  if (!schema || !/^auth_browser_[a-z0-9_]+$/.test(schema)) {
    throw new Error('E2E_DATABASE_URL schema must be auth_browser_<nonce>');
  }
  return value;
}
