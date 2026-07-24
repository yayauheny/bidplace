const expectedDatabaseName = 'bidplace_e2e';
const expectedPort = '5432';
const localHostnames = new Set(['127.0.0.1', 'localhost', '::1']);

function normalizeNodeEnv(nodeEnv) {
  return (nodeEnv ?? process.env.NODE_ENV ?? '').trim();
}

function normalizeBoolean(value) {
  return value === true || value === 'true';
}

function normalizeDatabaseUrl(databaseUrl) {
  if (typeof databaseUrl !== 'string' || !databaseUrl.trim()) {
    throw new Error('E2E_DATABASE_URL is required');
  }

  return new URL(databaseUrl);
}

function isLocalHost(hostname) {
  return localHostnames.has(hostname);
}

function getDatabaseName(url) {
  return url.pathname.replace(/^\//, '');
}

export function assertDisposableDatabase(databaseUrl, options = {}) {
  const nodeEnv = normalizeNodeEnv(options.nodeEnv);
  const allowNonLocalReset = normalizeBoolean(
    options.allowNonLocalReset ?? process.env.E2E_ALLOW_DESTRUCTIVE_RESET,
  );

  if (nodeEnv !== 'test') {
    throw new Error('NODE_ENV must be test for Playwright E2E preparation');
  }

  const url = normalizeDatabaseUrl(databaseUrl);

  if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
    throw new Error('E2E_DATABASE_URL must use a PostgreSQL protocol');
  }

  const databaseName = getDatabaseName(url);

  if (databaseName !== expectedDatabaseName) {
    throw new Error(
      `E2E_DATABASE_URL must target ${expectedDatabaseName}, got ${databaseName}`,
    );
  }

  if (url.port !== expectedPort) {
    throw new Error(
      `E2E_DATABASE_URL must use port ${expectedPort}, got ${url.port || 'default'}`,
    );
  }

  if (!allowNonLocalReset && !isLocalHost(url.hostname)) {
    throw new Error(
      `E2E_DATABASE_URL must point to a local host unless E2E_ALLOW_DESTRUCTIVE_RESET=true`,
    );
  }

  return {
    url,
    databaseName,
    hostname: url.hostname,
    port: url.port,
    isLocalHost: isLocalHost(url.hostname),
    allowNonLocalReset,
  };
}

export function createMaintenanceDatabaseUrl(databaseUrl) {
  const url = normalizeDatabaseUrl(databaseUrl);
  url.pathname = '/postgres';
  return url.toString();
}
