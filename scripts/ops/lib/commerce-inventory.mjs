const KNOWN_APP_ENVS = new Set(['local', 'staging', 'production']);
const KNOWN_NODE_ENVS = new Set(['development', 'test', 'production']);
const DECISION_STATUSES = ['SCHEDULED', 'LIVE'];
const FINGERPRINT_TOKEN = /^[A-Za-z0-9._:-]+$/;

export function parseInventoryArgs(argv) {
  for (const arg of argv) {
    if (arg === '--apply' || arg.startsWith('--apply')) {
      throw new Error(
        'commerce-inventory is read-only and refuses --apply or any write flag',
      );
    }
    if (arg.startsWith('--')) {
      throw new Error(`Unknown flag ${arg}. This command is read-only.`);
    }
    throw new Error(`Unexpected argument ${arg}. This command is read-only.`);
  }

  return { mode: 'read-only' };
}

export function parseDatabaseTarget(databaseUrl) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  let url;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL is not a valid URL');
  }

  if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL must use the PostgreSQL protocol');
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!database) {
    throw new Error('DATABASE_URL must include a database name');
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const port = url.port || '5432';
  const schema = url.searchParams.get('schema') || 'public';
  assertFingerprintToken(hostname, 'hostname');
  assertFingerprintToken(port, 'port');
  assertFingerprintToken(database, 'database');
  assertFingerprintToken(schema, 'schema');

  return { hostname, port, database, schema };
}

export function assertReadEnvironment(env = process.env) {
  const nodeEnv = env.NODE_ENV;
  const appEnv = env.APP_ENV;

  if (!nodeEnv) {
    throw new Error('NODE_ENV must be set explicitly');
  }
  if (!appEnv) {
    throw new Error('APP_ENV must be set explicitly');
  }
  if (!KNOWN_NODE_ENVS.has(nodeEnv)) {
    throw new Error(`Unknown NODE_ENV "${nodeEnv}"`);
  }
  if (!KNOWN_APP_ENVS.has(appEnv)) {
    throw new Error(`Unknown APP_ENV "${appEnv}"`);
  }
  if (appEnv === 'production' && nodeEnv !== 'production') {
    throw new Error('APP_ENV=production requires NODE_ENV=production');
  }
  if (nodeEnv === 'production' && appEnv === 'local') {
    throw new Error(
      'NODE_ENV=production requires APP_ENV=production or APP_ENV=staging',
    );
  }

  return { nodeEnv, appEnv };
}

export function assertReadTarget({ fingerprint, connectedDatabase }) {
  if (!connectedDatabase) {
    throw new Error('Could not read current_database()');
  }
  if (connectedDatabase !== fingerprint.database) {
    throw new Error(
      `Connected database "${connectedDatabase}" does not match DATABASE_URL database "${fingerprint.database}"`,
    );
  }
}

export async function readConnectedDatabase(prisma) {
  const rows = await prisma.$queryRaw`
    SELECT current_database() AS database
  `;
  const database = rows[0]?.database;
  if (typeof database !== 'string' || database.length === 0) {
    throw new Error('Could not read current_database()');
  }
  return database;
}

export async function collectInventory(prisma) {
  const [listingsByStatus, bids, ordersByStatus, listingsRequiringDecision] =
    await Promise.all([
      countBy(prisma.listing, 'status'),
      prisma.bid.count(),
      countBy(prisma.order, 'status'),
      prisma.listing.findMany({
        where: { status: { in: DECISION_STATUSES } },
        select: { id: true, status: true, productId: true },
        orderBy: [{ status: 'asc' }, { id: 'asc' }],
      }),
    ]);

  const listingTotal = Object.values(listingsByStatus).reduce(
    (sum, count) => sum + count,
    0,
  );

  return {
    listingTotal,
    listingsByStatus,
    bids,
    ordersByStatus,
    listingsRequiringDecision,
  };
}

export function formatInventoryReport({ environment, target, inventory }) {
  return `${JSON.stringify(
    {
      mode: 'read-only',
      writes: false,
      environment,
      target: {
        database: target.database,
        schema: target.schema,
        hostname: target.hostname,
        port: target.port,
      },
      inventory,
      note: 'Read-only leftover commerce inventory. This is not a staging or production dry-run unless that environment was the connected target.',
    },
    null,
    2,
  )}\n`;
}

export function reportContainsSecrets(text) {
  return /:\/\//.test(text) || /postgresql/i.test(text) || /:[^/\s]+@/.test(text);
}

function assertFingerprintToken(value, label) {
  if (!FINGERPRINT_TOKEN.test(value)) {
    throw new Error(`${label} cannot be used in the inventory target`);
  }
}

async function countBy(model, field) {
  const rows = await model.groupBy({
    by: [field],
    _count: { _all: true },
  });
  return Object.fromEntries(
    rows.map((row) => [String(row[field]), row._count._all]),
  );
}
