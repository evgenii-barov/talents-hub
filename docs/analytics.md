# Product analytics with self-hosted Umami

Talents Hub runs Umami as an isolated production service. Umami has its own PostgreSQL database,
private Docker network, persistent volume, and public dashboard host. The application remains
available if analytics is unavailable: neither frontend nor backend health depends on Umami.

## Privacy model

The tracker is disabled until a visitor explicitly allows anonymous analytics. The preference is
stored for one year in `talents-hub-cookie-consent` and can be changed on `/cookies`.

The integration deliberately does not use Umami Distinct IDs or session data. It never sends:

- account IDs, names, email addresses, or profile slugs;
- form contents, cover letters, moderation notes, or chat messages;
- search terms, URL query strings, or URL fragments;
- uploaded filenames or document metadata.

Umami uses the request IP address, browser user agent, and Website ID to derive an anonymous session.
The raw account identity is not involved, and `SALT_ROTATION=month` prevents that anonymous session
identifier from becoming a permanent cross-month identifier.

The browser's Do Not Track preference takes precedence over consent. Pageviews use paths without
queries or fragments. Automatic Umami tracking is disabled; all pageviews and events pass through
the typed adapter in `frontend/lib/analytics.ts`.

## Production services

| Service | Purpose | Exposure |
| --- | --- | --- |
| `umami` | Umami 3.3.1 application and tracker | Caddy only |
| `umami-db` | Dedicated PostgreSQL 17 database | internal `analytics` network |
| `insights.<domain>` | Dashboard, tracker script, collection endpoint | HTTPS through Caddy |

Umami telemetry and external runtime calls are disabled. The tracker and collection endpoint use
the less generic paths `/th.js` and `/api/th`.

## First-time setup

1. Add an A/AAAA record for `insights.talents-hub.online` pointing to the production server.
2. Run `bash scripts/configure_production_hosts.sh .env.production`. It creates the Umami database
   password, app secret, and two-factor encryption key without printing them.
3. Validate and start the analytics services:

   ```bash
   python scripts/production_preflight.py .env.production
   docker compose --env-file .env.production -f compose.production.yaml up -d umami-db umami caddy
   ```

4. Open `https://insights.talents-hub.online`, sign in with the initial `admin` / `umami`
   credentials, and immediately change the password.
5. Enable two-factor authentication for the administrator.
6. Create a website named `Talents Hub` with domain `talents-hub.online` and copy its Website ID.
7. Set `UMAMI_WEBSITE_ID=<uuid>` in `.env.production`, validate it, and rebuild the frontend because
   the tracker configuration is compiled into the Next.js bundle:

   ```bash
   python scripts/production_preflight.py .env.production
   docker compose --env-file .env.production -f compose.production.yaml build frontend
   docker compose --env-file .env.production -f compose.production.yaml up -d frontend caddy
   ```

8. In a private browser window, allow anonymous analytics and confirm that a request reaches
   `https://insights.talents-hub.online/api/th`. Choosing “Necessary only” must result in no tracker
   request.

Analytics stays safely disabled when `UMAMI_WEBSITE_ID` is empty or malformed.

## Event catalogue

| Event | Sent after | Properties |
| --- | --- | --- |
| `account signup completed` | email signup API succeeds | `method` |
| `account sign in completed` | email login succeeds | `method` |
| `email verification completed` | verification API succeeds | none |
| `profile moderation requested` | profile is submitted for moderation | none |
| `project created` | project and roles are saved | `role_count`, `submission` |
| `application submitted` | application API succeeds | `project_id`, `role_id` |
| `application status changed` | a valid transition succeeds | `status` |
| `conversation created` | the first conversation request succeeds | `kind`, `project_context` |

Event names and property schemas are compile-time checked. The adapter also removes property keys
that look like personal or free-text data as a runtime safeguard.

## Initial dashboards

Create two funnels:

1. Talent activation: signup → email verification → profile moderation → application submitted.
2. Project lead activation: signup → project created → application status changed.

Use weekly visitors who trigger at least one collaboration event as the initial engagement metric.
Do not enable session replay until a separate privacy review covers chat, profiles, applications,
moderation, and file uploads.

## Backup and recovery

Run `scripts/backup-umami.sh` on the same schedule as the application database backup and copy the
result off-server. Restore only on an isolated environment first:

```bash
sh scripts/backup-umami.sh
RESTORE_CONFIRM=umami sh scripts/restore-umami.sh backups/umami-<timestamp>.sql.gz
```

The database contains usage history and must receive the same access control and retention policy
as other production data.
