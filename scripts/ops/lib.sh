#!/usr/bin/env bash
set -euo pipefail

normalize_pg_url() {
  node -e "
    const url = new URL(process.argv[1]);
    url.searchParams.delete('schema');
    console.log(url.toString());
  " "$1"
}

postgres_container_name() {
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx bidplace-postgres; then
    echo bidplace-postgres
    return 0
  fi

  return 1
}

load_pg_connection() {
  local database_url="$1"
  local normalized_url

  normalized_url="$(normalize_pg_url "$database_url")"
  PG_URL="$normalized_url"
  PG_USER="$(node -e "const u = new URL(process.argv[1]); console.log(decodeURIComponent(u.username));" "$normalized_url")"
  PG_PASSWORD="$(node -e "const u = new URL(process.argv[1]); console.log(decodeURIComponent(u.password));" "$normalized_url")"
  PG_DATABASE="$(node -e "const u = new URL(process.argv[1]); console.log(decodeURIComponent(u.pathname.slice(1)));" "$normalized_url")"
  PG_HOST="$(node -e "const u = new URL(process.argv[1]); console.log(u.hostname);" "$normalized_url")"
}

should_use_docker_postgres() {
  load_pg_connection "$1"

  if [[ "$PG_HOST" == "127.0.0.1" || "$PG_HOST" == "localhost" || "$PG_HOST" == "postgres" ]]; then
    postgres_container_name >/dev/null
    return $?
  fi

  return 1
}

run_psql() {
  local database_url="$1"
  shift

  load_pg_connection "$database_url"

  if should_use_docker_postgres "$database_url"; then
    docker exec \
      -e PGPASSWORD="$PG_PASSWORD" \
      "$(postgres_container_name)" \
      psql -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$PG_DATABASE" "$@"
    return 0
  fi

  PGPASSWORD="$PG_PASSWORD" psql "$PG_URL" -v ON_ERROR_STOP=1 "$@"
}

run_pg_dump() {
  local database_url="$1"
  local output_file="$2"

  load_pg_connection "$database_url"

  if should_use_docker_postgres "$database_url"; then
    docker exec \
      -e PGPASSWORD="$PG_PASSWORD" \
      "$(postgres_container_name)" \
      pg_dump -U "$PG_USER" -d "$PG_DATABASE" -Fc >"$output_file"
    return 0
  fi

  PGPASSWORD="$PG_PASSWORD" pg_dump "$PG_URL" -Fc -f "$output_file"
}

run_pg_restore() {
  local database_url="$1"
  local dump_file="$2"

  load_pg_connection "$database_url"

  if should_use_docker_postgres "$database_url"; then
    docker exec -i \
      -e PGPASSWORD="$PG_PASSWORD" \
      "$(postgres_container_name)" \
      pg_restore --clean --if-exists --no-owner -U "$PG_USER" -d "$PG_DATABASE" <"$dump_file"
    return 0
  fi

  PGPASSWORD="$PG_PASSWORD" pg_restore --clean --if-exists --no-owner --dbname="$PG_URL" "$dump_file"
}
