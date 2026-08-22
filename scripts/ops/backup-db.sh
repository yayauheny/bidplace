#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

SOURCE_DATABASE_URL="${SOURCE_DATABASE_URL:-${DATABASE_URL:-}}"

if [[ -z "$SOURCE_DATABASE_URL" ]]; then
  echo "Set SOURCE_DATABASE_URL or DATABASE_URL before running backup." >&2
  exit 1
fi

if ! should_use_docker_postgres "$(normalize_pg_url "$SOURCE_DATABASE_URL")" \
  && ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump is required but was not found in PATH." >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
mkdir -p "$BACKUP_DIR"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
output="$BACKUP_DIR/bidplace-${timestamp}.dump"

run_pg_dump "$SOURCE_DATABASE_URL" "$output"

if [[ -n "${BACKUP_GPG_RECIPIENT:-}" ]]; then
  if ! command -v gpg >/dev/null 2>&1; then
    echo "BACKUP_GPG_RECIPIENT is set but gpg is not installed." >&2
    exit 1
  fi

  gpg --batch --yes --encrypt -r "$BACKUP_GPG_RECIPIENT" -o "${output}.gpg" "$output"
  rm "$output"
  echo "Encrypted backup written to ${output}.gpg"
else
  echo "Backup written to $output"
fi
