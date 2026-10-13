import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { blockingDatabaseSessionSql } from '../../deploy/cloudflare/src/release-gate.ts';
import { root } from './config.mjs';
import { runDirectSql } from './deploy.mjs';
import {
  assertStagingDatabaseUrl,
  assertStagingMigrationStopped,
} from './staging.mjs';

const target = process.argv[2];
if (!['staging', 'production'].includes(target)) throw new Error('Choose staging or production');
if (target === 'production' && !process.argv.includes('--confirm-production')) {
  throw new Error('Production migration requires --confirm-production after backup/review');
}
if (!process.env.DATABASE_URL) throw new Error('Supply DATABASE_URL through the trusted operator environment');
let database;
try { database = new URL(process.env.DATABASE_URL); }
catch { throw new Error('Invalid migration DATABASE_URL; value is not logged'); }
if (!['postgres:', 'postgresql:'].includes(database.protocol) ||
    !database.hostname.endsWith('.neon.tech') || database.searchParams.get('sslmode') !== 'require') {
  throw new Error('Migration requires a Neon endpoint with sslmode=require');
}
if (database.hostname.split('.')[0].endsWith('-pooler')) {
  throw new Error('Migration requires the direct Neon hostname');
}
if (target === 'staging')
  assertStagingDatabaseUrl(
    process.env.DATABASE_URL,
    process.env.STAGING_NEON_ENDPOINT_ID,
    false,
  );
if (target === 'staging') {
  if (process.argv.includes('--initial-staging')) {
    runDirectSql(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public') THEN RAISE EXCEPTION 'staging_database_is_not_empty'; END IF; END $$;`,
      process.env.DATABASE_URL,
    );
  } else {
    await assertStagingMigrationStopped(process.env);
  }
}
runDirectSql(blockingDatabaseSessionSql, process.env.DATABASE_URL);
const temporary = mkdtempSync(join(tmpdir(), 'bidplace-neon-migrate-'));
try {
  cpSync(join(root, 'packages/database/prisma/schema.prisma'), join(temporary, 'schema.prisma'));
  cpSync(join(root, 'packages/database/prisma/migrations'), join(temporary, 'migrations'), { recursive: true });
  const result = spawnSync('node', [join(root, 'packages/database/node_modules/prisma/build/index.js'),
    'migrate', 'deploy', '--schema', join(temporary, 'schema.prisma')], {
    cwd: temporary, env: process.env, encoding: 'utf8',
  });
  // Prisma diagnostics may contain connection details: expose status/code only.
  if (result.error || result.status !== 0) {
    const code = result.stderr?.match(/\bP\d{4}\b/)?.[0] ?? 'no Prisma code';
    throw new Error(`Migration failed (${result.status ?? 'not started'}, ${code}); inspect on a trusted machine`);
  }
  console.log(`Prisma migration deploy completed for ${target}`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
