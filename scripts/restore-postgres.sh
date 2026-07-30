#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: RESTORE_CONFIRM=talents-hub ./scripts/restore-postgres.sh backups/file.sql.gz" >&2
  exit 2
fi
if [ "${RESTORE_CONFIRM:-}" != "talents-hub" ]; then
  echo "Restore refused. Set RESTORE_CONFIRM=talents-hub after verifying the target environment." >&2
  exit 2
fi

backup_file=$1
if [ ! -s "$backup_file" ]; then
  echo "Backup file does not exist or is empty: $backup_file" >&2
  exit 2
fi

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_root"

gzip -dc "$backup_file" \
  | docker compose --env-file .env.production -f compose.production.yaml exec -T db \
      sh -c 'psql --set ON_ERROR_STOP=on --username="$POSTGRES_USER" "$POSTGRES_DB"'

echo "Restore completed. Run application smoke tests before reopening traffic."
