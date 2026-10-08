export const RELEASE_HOLD_CLOSED = 'closed';
export const RELEASE_HOLD_OPEN = 'open';

export function isApiPath(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/');
}

export function releaseHoldClosed(hold: string | undefined): boolean {
  return hold === RELEASE_HOLD_CLOSED;
}

export function containerStopped(state: { status?: string } | null | undefined): boolean {
  return state?.status === 'stopped' || state?.status === 'stopped_with_code';
}

export const blockingDatabaseSessionSql = `
DO $$
DECLARE
  blockers integer;
BEGIN
  SELECT count(*) INTO blockers
  FROM pg_stat_activity
  WHERE datname = current_database()
    AND pid <> pg_backend_pid()
    AND state IN ('active', 'idle in transaction', 'idle in transaction (aborted)');
  IF blockers <> 0 THEN
    RAISE EXCEPTION 'blocking_database_sessions:%', blockers;
  END IF;
END $$;
`;

export const nicknameGateSql = `
DO $$
DECLARE
  mismatches integer;
  migration_ready boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM _prisma_migrations
    WHERE migration_name = '20261008040000_add_user_slug'
      AND finished_at IS NOT NULL
      AND rolled_back_at IS NULL
  ) INTO migration_ready;
  IF NOT migration_ready THEN
    RAISE EXCEPTION 'nickname_migration_missing';
  END IF;
  SELECT count(*) INTO mismatches
  FROM seller_profiles AS profile
  JOIN users AS account ON account.id = profile.user_id
  WHERE account.slug IS DISTINCT FROM profile.slug;
  IF mismatches <> 0 THEN
    RAISE EXCEPTION 'nickname_mismatch:%', mismatches;
  END IF;
END $$;
`;

export function databaseGuardFailure(output: string): 'sessions' | 'nicknames' | 'migration' | 'failed' {
  if (output.includes('blocking_database_sessions')) return 'sessions';
  if (output.includes('nickname_mismatch')) return 'nicknames';
  if (output.includes('nickname_migration_missing')) return 'migration';
  return 'failed';
}

export async function secretMatches(expected: string, provided: string): Promise<boolean> {
  if (!expected || !provided) return false;
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
  ]);
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a[index] ^ b[index];
  return diff === 0;
}
