const FIGMA_COMPARISON_DATABASE = 'bidplace_figma_comparison';
const INTEGRATION_DATABASE = 'bidplace_integration';
const FIGMA_COMPARISON_SCHEMA = 'public';
const INTEGRATION_SCHEMA_PATTERN = /^itest_[a-zA-Z0-9]+$/;

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

function isAllowedFigmaComparisonTarget(databaseName, schemaName) {
  if (databaseName === FIGMA_COMPARISON_DATABASE) {
    return schemaName === FIGMA_COMPARISON_SCHEMA;
  }

  if (databaseName === INTEGRATION_DATABASE) {
    return INTEGRATION_SCHEMA_PATTERN.test(schemaName);
  }

  return false;
}

function assertAllowedFigmaComparisonTarget(databaseName, schemaName) {
  if (isAllowedFigmaComparisonTarget(databaseName, schemaName)) {
    return { databaseName, schemaName };
  }

  throw new Error(
    `Refusing Figma comparison fixture for database "${databaseName}" schema "${schemaName}"`,
  );
}

function parseDatabaseTarget(databaseUrl) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  try {
    const url = new URL(databaseUrl);
    if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
      throw new Error('DATABASE_URL must use the PostgreSQL protocol');
    }

    const databaseName = decodeURIComponent(
      url.pathname.replace(/^\//, '').split('/')[0] ?? '',
    );
    if (!databaseName) {
      throw new Error('DATABASE_URL must include a database name');
    }

    const schemaName = url.searchParams.get('schema') || 'public';
    if (!schemaName) {
      throw new Error('DATABASE_URL must include a schema name');
    }

    return { databaseName, schemaName };
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

function parseDatabaseName(databaseUrl) {
  return parseDatabaseTarget(databaseUrl).databaseName;
}

function assertFigmaComparisonTarget(databaseUrl, env = process.env) {
  assertLocalFigmaComparisonEnv(env);
  const target = parseDatabaseTarget(databaseUrl);
  return assertAllowedFigmaComparisonTarget(
    target.databaseName,
    target.schemaName,
  );
}

async function readConnectedFigmaComparisonTarget(prisma) {
  const rows = await prisma.$queryRaw`
    SELECT current_database() AS database_name, current_schema() AS schema_name
  `;
  const databaseName = rows[0]?.database_name;
  const schemaName = rows[0]?.schema_name;
  if (
    typeof databaseName !== 'string' ||
    typeof schemaName !== 'string' ||
    databaseName.length === 0 ||
    schemaName.length === 0
  ) {
    throw new Error(
      'Refusing Figma comparison fixture because the connected session did not report current_database() and current_schema()',
    );
  }

  return { databaseName, schemaName };
}

async function assertConnectedFigmaComparisonTarget(
  prisma,
  env = process.env,
  databaseUrl,
) {
  assertLocalFigmaComparisonEnv(env);

  let expected;
  if (databaseUrl !== undefined) {
    expected = parseDatabaseTarget(databaseUrl);
    assertAllowedFigmaComparisonTarget(
      expected.databaseName,
      expected.schemaName,
    );
  }

  const connected = await readConnectedFigmaComparisonTarget(prisma);

  if (
    expected &&
    (expected.databaseName !== connected.databaseName ||
      expected.schemaName !== connected.schemaName)
  ) {
    throw new Error(
      `Refusing Figma comparison fixture because DATABASE_URL targets "${expected.databaseName}" schema "${expected.schemaName}" but the connected session is "${connected.databaseName}" schema "${connected.schemaName}"`,
    );
  }

  return assertAllowedFigmaComparisonTarget(
    connected.databaseName,
    connected.schemaName,
  );
}

module.exports = {
  FIGMA_COMPARISON_DATABASE,
  FIGMA_COMPARISON_SCHEMA,
  INTEGRATION_DATABASE,
  assertAllowedFigmaComparisonTarget,
  assertLocalFigmaComparisonEnv,
  assertConnectedFigmaComparisonTarget,
  assertFigmaComparisonTarget,
  isAllowedFigmaComparisonTarget,
  parseDatabaseName,
  parseDatabaseTarget,
};
