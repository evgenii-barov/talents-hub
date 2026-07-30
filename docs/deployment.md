# Production deployment

The production stack is defined in `compose.production.yaml`. It keeps PostgreSQL and Redis on
an internal Docker network and publishes only Caddy ports 80/443. Caddy routes the frontend, API,
admin, static files, local media, and WebSocket traffic from a single public origin.

## Before the first server start

1. Copy `.env.production.example` to `.env.production`.
2. Generate unique random values for `DJANGO_SECRET_KEY`, `POSTGRES_PASSWORD`, and
   `REDIS_PASSWORD`. When a password is used in a URL, URL-encode it there.
3. Set `SITE_ADDRESS`, `WWW_SITE_ADDRESS`, `PUBLIC_SITE_URL`, `FRONTEND_URL`, allowed hosts,
   CORS, and CSRF origins. The `www` address permanently redirects to `PUBLIC_SITE_URL`.
   An initial IP-only staging deployment may use `http://<server-ip>`. A public deployment must use
   the final HTTPS domain. For HTTP staging keep the four `DJANGO_*SECURE*` values from the example;
   for HTTPS set redirect and secure cookies to `true` and HSTS to `31536000`.
4. Validate without printing secrets:

   ```bash
   python scripts/production_preflight.py .env.production
   docker compose --env-file .env.production -f compose.production.yaml config --quiet
   ```

5. Build and start:

   ```bash
   docker compose --env-file .env.production -f compose.production.yaml build
   docker compose --env-file .env.production -f compose.production.yaml up -d
   docker compose --env-file .env.production -f compose.production.yaml ps
   ```

6. Seed reference data and create the first administrator:

   ```bash
   docker compose --env-file .env.production -f compose.production.yaml exec backend python manage.py seed_mvp_taxonomy
   docker compose --env-file .env.production -f compose.production.yaml exec backend python manage.py createsuperuser
   ```

7. Verify `/`, `/api/health/`, `/api/ready/`, `/admin/`, and a WebSocket chat connection.

The frontend public URLs are build-time values. Rebuild the frontend whenever the public domain
changes:

```bash
docker compose --env-file .env.production -f compose.production.yaml build frontend
docker compose --env-file .env.production -f compose.production.yaml up -d frontend caddy
```

## After the domain is available

1. Point DNS A/AAAA records to the server and allow inbound TCP 80/443 and UDP 443. Do not expose
   PostgreSQL or Redis. Caddy obtains and renews TLS certificates automatically.
2. Change all public URLs and trusted origins to `https://<domain>`, then rerun preflight and rebuild
   the frontend.
3. Configure SMTP plus SPF, DKIM, and DMARC. Before public registration, run:

   ```bash
   python scripts/production_preflight.py .env.production --strict-external
   ```

4. Configure S3-compatible storage, OAuth callbacks, and Sentry as required. OAuth and Sentry are
   optional; foreign OAuth remains fail-closed while `SOCIAL_AUTH_ENABLED=false`. Working SMTP is
   required because email verification is mandatory.
5. Confirm that `/api/docs/` returns 404 in production (`ENABLE_API_DOCS=false`).

## Backups

Run `scripts/backup-postgres.sh` from cron or a systemd timer. Copy the resulting encrypted backup
off the application server and define retention. Test `scripts/restore-postgres.sh` on staging after
every material schema change and at least quarterly. A backup is not considered valid until restore
has been tested.

Uploads use the persistent `media_data` volume until S3 is enabled. Back up that volume alongside
PostgreSQL while local media storage is active.
