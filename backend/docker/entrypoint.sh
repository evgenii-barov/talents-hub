#!/bin/sh
set -eu

python - <<'PY'
import os
import time

import psycopg

database_url = os.environ["DATABASE_URL"]
for attempt in range(30):
    try:
        with psycopg.connect(database_url):
            break
    except psycopg.OperationalError:
        if attempt == 29:
            raise
        time.sleep(1)
PY

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
    python manage.py migrate --noinput
fi

exec "$@"
