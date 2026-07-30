#!/bin/sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_root"

backup_dir=${BACKUP_DIR:-"$project_root/backups"}
mkdir -p "$backup_dir"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
target="$backup_dir/talents-hub-$timestamp.sql.gz"

docker compose --env-file .env.production -f compose.production.yaml exec -T db \
  sh -c 'pg_dump --clean --if-exists --no-owner --username="$POSTGRES_USER" "$POSTGRES_DB"' \
  | gzip -9 > "$target"

test -s "$target"
echo "Backup written to $target"
