#!/bin/sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_root"

backup_dir=${BACKUP_DIR:-"$project_root/backups"}
mkdir -p "$backup_dir"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
target="$backup_dir/umami-$timestamp.sql.gz"

docker compose --env-file .env.production -f compose.production.yaml exec -T umami-db \
  sh -c 'pg_dump --clean --if-exists --no-owner --username="$POSTGRES_USER" "$POSTGRES_DB"' \
  | gzip -9 > "$target"

test -s "$target"
echo "Umami backup written to $target"
