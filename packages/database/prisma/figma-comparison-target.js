const FORBIDDEN_DATABASE_NAMES = new Set([
  'bidplace',
  'bidplace_e2e',
  'postgres',
  'auction',
]);

function assertLocalFigmaComparisonEnv(env = process.env) {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const appEnv = env.APP_ENV ?? 'local';
  const allowed =
    ['development', 'test'].includes(nodeEnv) &&
    appEnv === 'local' &&
    env.ALLOW_FIGMA_COMPARISON_FIXTURE === 'true';

  if (!allowed) {
    throw new Error(
      'Refusing Figma comparison fixture outside an explicitly allowed local/test profile (NODE_ENV=development|test, APP_ENV=local, ALLOW_FIGMA_COMPARISON_FIXTURE=true)',
    );
  }
}

function isDisposableComparisonDatabaseName(name) {
  if (!name || FORBIDDEN_DATABASE_NAMES.has(name)) {
    return false;
  }

  return /(?:^|_)(preview|test|integration|figma[_-]?comparison)(?:_|$)/i.test(
    name,
  );
}

function parseDatabaseName(databaseUrl) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  try {
    const url = new URL(databaseUrl);
    if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
      throw new Error('DATABASE_URL must use the PostgreSQL protocol');
    }

    const name = decodeURIComponent(
      url.pathname.replace(/^\//, '').split('/')[0] ?? '',
    );
    if (!name) {
      throw new Error('DATABASE_URL must include a database name');
    }

    return name;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith('DATABASE_URL') ||
        error.message.includes('PostgreSQL'))
    ) {
      throw error;
    }

    throw new Error('DATABASE_URL must be a valid PostgreSQL URL');
  }
}

function assertFigmaComparisonTarget(databaseUrl, env = process.env) {
  assertLocalFigmaComparisonEnv(env);
  const databaseName = parseDatabaseName(databaseUrl);
  if (!isDisposableComparisonDatabaseName(databaseName)) {
    throw new Error(
      `Refusing Figma comparison fixture for non-disposable database "${databaseName}"`,
    );
  }

  return databaseName;
}

async function assertConnectedFigmaComparisonTarget(prisma, env = process.env) {
  assertLocalFigmaComparisonEnv(env);
  const rows = await prisma.$queryRaw`SELECT current_database() AS name`;
  const databaseName = rows[0]?.name;
  if (!isDisposableComparisonDatabaseName(databaseName)) {
    throw new Error(
      `Refusing Figma comparison fixture for non-disposable database "${databaseName}"`,
    );
  }

  return databaseName;
}

module.exports = {
  FORBIDDEN_DATABASE_NAMES,
  assertLocalFigmaComparisonEnv,
  assertConnectedFigmaComparisonTarget,
  assertFigmaComparisonTarget,
  isDisposableComparisonDatabaseName,
  parseDatabaseName,
};
