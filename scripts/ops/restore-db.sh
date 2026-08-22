#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

TARGET_DATABASE_URL="${TARGET_DATABASE_URL:-}"
DUMP_FILE="${1:-}"

if [[ -z "$TARGET_DATABASE_URL" ]]; then
  echo "Set TARGET_DATABASE_URL to a non-production restore database." >&2
  exit 1
fi

if [[ -z "$DUMP_FILE" ]]; then
  echo "Usage: TARGET_DATABASE_URL=... $0 <dump-file>" >&2
  exit 1
fi

if [[ ! -f "$DUMP_FILE" ]]; then
  echo "Dump file not found: $DUMP_FILE" >&2
  exit 1
fi

if ! should_use_docker_postgres "$(normalize_pg_url "$TARGET_DATABASE_URL")" \
  && ! command -v pg_restore >/dev/null 2>&1; then
  echo "pg_restore is required but was not found in PATH." >&2
  exit 1
fi

db_name="$(node -e "console.log(decodeURIComponent(new URL(process.argv[1]).pathname.slice(1)))" "$(normalize_pg_url "$TARGET_DATABASE_URL")")"

if [[ "$db_name" == "bidplace" ]]; then
  echo "Refusing to restore into primary bidplace database." >&2
  exit 1
fi

if [[ ! "$db_name" =~ restore|integration|_test|_e2e ]]; then
  echo "TARGET_DATABASE_URL database name must include restore, integration, _test, or _e2e." >&2
  exit 1
fi

admin_url="$(node -e "
const url = new URL(process.argv[1]);
url.pathname = '/postgres';
console.log(url.toString());
" "$(normalize_pg_url "$TARGET_DATABASE_URL")")"

if ! run_psql "$admin_url" -tc "SELECT 1 FROM pg_database WHERE datname = '$db_name'" | grep -q 1; then
  run_psql "$admin_url" -c "CREATE DATABASE \"$db_name\""
fi

run_pg_restore "$TARGET_DATABASE_URL" "$DUMP_FILE"
echo "Restore completed into database: $db_name"
