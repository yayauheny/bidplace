const ACTIVE_LISTING_STATUSES = ['SCHEDULED', 'LIVE'];
const SENSITIVE_APP_ENVS = new Set(['production', 'staging']);
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
const FINGERPRINT_TOKEN = /^[A-Za-z0-9._:-]+$/;

export const COMMERCE_INVENTORY_CANCEL_REASON =
  'DEC-087 leftover commerce neutralize';

export function parseInventoryArgs(argv) {
  const flags = {
    apply: false,
    expectedActive: undefined,
    confirmTarget: undefined,
    confirmEnv: undefined,
  };

  for (const arg of argv) {
    if (arg === '--apply') {
      flags.apply = true;
      continue;
    }
    if (arg.startsWith('--expected-active=')) {
      flags.expectedActive = arg.slice('--expected-active='.length);
      continue;
    }
    if (arg.startsWith('--confirm-target=')) {
      flags.confirmTarget = arg.slice('--confirm-target='.length);
      continue;
    }
    if (arg.startsWith('--confirm-env=')) {
      flags.confirmEnv = arg.slice('--confirm-env='.length);
      continue;
    }
    if (arg.startsWith('--')) {
      throw new Error(`Unknown flag ${arg}`);
    }
  }

  return flags;
}

export function parseExpectedActive(raw) {
  if (raw === undefined || raw === '') {
    throw new Error(
      'Pass --expected-active=N matching the dry-run activeListings count',
    );
  }
  if (!/^\d+$/.test(raw)) {
    throw new Error('--expected-active must be a non-negative integer');
  }
  return Number.parseInt(raw, 10);
}

export function parseDatabaseTarget(databaseUrl) {
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

  return {
    hostname,
    port,
    database,
    schema,
    confirmTarget: `${hostname}:${port}/${database}/${schema}`,
  };
}

export function quoteShellArg(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

export function formatApplyHint({
  expectedActive,
  confirmTarget,
  confirmEnv,
  envConfirmationRequired,
}) {
  const flags = [
    '--apply',
    `--expected-active=${expectedActive}`,
    `--confirm-target=${quoteShellArg(confirmTarget)}`,
  ];
  if (envConfirmationRequired) {
    flags.push(`--confirm-env=${quoteShellArg(confirmEnv || 'APP_ENV')}`);
  }
  return `Read-only inventory. Re-run with ${flags.join(' ')}.`;
}

function assertFingerprintToken(value, label) {
  if (!FINGERPRINT_TOKEN.test(value)) {
    throw new Error(
      `${label} ${JSON.stringify(value)} cannot be used in confirmTarget`,
    );
  }
}

export function isLoopbackHostname(hostname) {
  return LOOPBACK_HOSTS.has(String(hostname).toLowerCase());
}

export function envConfirmationRequired(appEnv, hostname) {
  return SENSITIVE_APP_ENVS.has(appEnv) || !isLoopbackHostname(hostname);
}

export function assertApplyGuards({
  expectedActive,
  confirmTarget,
  confirmEnv,
  fingerprint,
  connectedDatabase,
  preflightCount,
  appEnv,
}) {
  if (connectedDatabase !== fingerprint.database) {
    throw new Error(
      `Connected database "${connectedDatabase}" does not match DATABASE_URL database "${fingerprint.database}"`,
    );
  }

  if (!confirmTarget) {
    throw new Error(
      `Pass --confirm-target=${quoteShellArg(fingerprint.confirmTarget)} from the dry-run fingerprint`,
    );
  }

  if (confirmTarget !== fingerprint.confirmTarget) {
    throw new Error(
      `--confirm-target does not match ${fingerprint.confirmTarget}`,
    );
  }

  if (expectedActive !== preflightCount) {
    throw new Error(
      `--expected-active=${expectedActive} does not match preflight activeListings=${preflightCount}`,
    );
  }

  const remote = !isLoopbackHostname(fingerprint.hostname);
  const sensitive = SENSITIVE_APP_ENVS.has(appEnv);

  if (remote && !sensitive) {
    throw new Error(
      'Refusing apply against a remote host while APP_ENV is not production or staging. Set APP_ENV correctly and pass --confirm-env.',
    );
  }

  if (sensitive || remote) {
    if (!confirmEnv) {
      throw new Error(`Pass --confirm-env=${appEnv} matching APP_ENV`);
    }
    if (confirmEnv !== appEnv) {
      throw new Error('--confirm-env does not match APP_ENV');
    }
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
  const [migrations, listingsByStatus, bids, ordersByStatus, activeListings] =
    await Promise.all([
      prisma.$queryRaw`
        SELECT migration_name, finished_at
        FROM "_prisma_migrations"
        ORDER BY finished_at ASC NULLS LAST, migration_name ASC
      `,
      countBy(prisma.listing, 'status'),
      prisma.bid.count(),
      countBy(prisma.order, 'status'),
      prisma.listing.findMany({
        where: { status: { in: ACTIVE_LISTING_STATUSES } },
        select: { id: true, status: true, productId: true },
        orderBy: { id: 'asc' },
      }),
    ]);

  return {
    migrations: migrations.map((row) => row.migration_name),
    listingsByStatus,
    bids,
    ordersByStatus,
    activeListings: activeListings.length,
  };
}

export async function applyCancellation(prisma, expectedActive) {
  return prisma.$transaction(
    async (tx) => {
      const rows = await tx.listing.findMany({
        where: { status: { in: ACTIVE_LISTING_STATUSES } },
        select: { id: true, status: true },
        orderBy: { id: 'asc' },
      });

      if (rows.length !== expectedActive) {
        throw new Error(
          `Active listing count ${rows.length} does not match --expected-active=${expectedActive}`,
        );
      }

      if (rows.length === 0) {
        return { cancelled: 0, auditCreated: 0, closedAt: null };
      }

      const closedAt = new Date();
      const updated = await tx.listing.updateMany({
        where: {
          id: { in: rows.map((row) => row.id) },
          status: { in: ACTIVE_LISTING_STATUSES },
        },
        data: { status: 'CANCELLED', closedAt },
      });

      if (updated.count !== expectedActive) {
        throw new Error(
          `Updated ${updated.count} listings, expected ${expectedActive}`,
        );
      }

      await tx.auditEvent.createMany({
        data: rows.map((row) => ({
          actorUserId: null,
          targetType: 'LISTING',
          targetId: row.id,
          oldStatus: row.status,
          newStatus: 'CANCELLED',
          reason: COMMERCE_INVENTORY_CANCEL_REASON,
        })),
      });

      return {
        cancelled: updated.count,
        auditCreated: rows.length,
        closedAt: closedAt.toISOString(),
      };
    },
    { isolationLevel: 'Serializable' },
  );
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
