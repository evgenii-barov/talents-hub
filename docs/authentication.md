# Authentication and email delivery

## MVP methods

Talents Hub supports the following methods:

- email and password, with a one-time **confirmation link** after registration;
- Google OAuth;
- GitHub OAuth.

Foreign OAuth is guarded by `SOCIAL_AUTH_ENABLED`. Production defaults this flag to `false`,
which hides all provider buttons, returns an empty provider list, and does not mount the
`/accounts/` OAuth routes. This fail-closed default must only be changed after a compliance
review for the jurisdictions where the service is available.

The confirmation link is deliberately used instead of a numeric email code. It is already
implemented, contains a short-lived server-side token, and avoids an additional code-entry
screen. Passwordless login by code is not part of this MVP.

Google and GitHub identities are linked to a local `User` and mirrored to
`ExternalIdentity`. Provider access tokens are not retained. A matching email address alone
does not automatically attach a new social identity to an existing account. OAuth itself is the
authentication step for a new Google/GitHub account; the Postbox confirmation link applies to
email/password registration.

## Local development

Without OAuth client credentials, the email/password flow is the only one displayed. This is
intentional: buttons must not send users to a provider that cannot complete its callback.

Set both variables for a provider to enable it:

```dotenv
SOCIAL_AUTH_ENABLED=true
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
```

For the default local backend, register these callback URLs:

```text
http://localhost:8000/accounts/google/login/callback/
http://localhost:8000/accounts/github/login/callback/
```

The successful callback creates the normal Django session and redirects to
`FRONTEND_URL/profile`.

## Production OAuth setup

1. Publish the frontend and backend behind HTTPS. Prefer one public origin with a reverse
   proxy; otherwise set the production frontend URL in `FRONTEND_URL` and CORS/CSRF allowlists.
2. Create a Google OAuth web application and a GitHub OAuth application.
3. Register the exact public callback URLs:
   `https://<backend-public-origin>/accounts/google/login/callback/` and
   `https://<backend-public-origin>/accounts/github/login/callback/`. With a single-origin
   reverse proxy, `<backend-public-origin>` is simply your main site domain.
4. Store both provider client IDs and secrets in deployment secrets, not in Django Admin or Git.
   Set `SOCIAL_AUTH_ENABLED=true` only when these providers are legally available to the target
   users; leaving stored credentials in the environment does not bypass the disabled flag.
5. Use only identity scopes: Google `openid profile email`, GitHub `user:email`. The MVP does
   not request repository access.
6. Verify a new account, an existing social account, cancellation at the provider, and an
   existing email/password account before release.

## Yandex Cloud Postbox API

The development configuration writes emails to the backend console. Production sends transactional
email through the Postbox SESv2-compatible HTTPS API, matching the Arc Store integration:

```dotenv
DJANGO_EMAIL_BACKEND=config.email_backends.YandexPostboxEmailBackend
DEFAULT_FROM_EMAIL=Talents Hub <noreply@talents-hub.online>
YANDEX_POSTBOX_ACCESS_KEY_ID=<Postbox static access key ID>
YANDEX_POSTBOX_SECRET_KEY=<Postbox static secret key>
YANDEX_POSTBOX_ENDPOINT=https://postbox.cloud.yandex.net
YANDEX_POSTBOX_REGION=ru-central1
YANDEX_POSTBOX_CONFIGURATION_SET=
EMAIL_TIMEOUT=15
```

Use a static access key for a service account with the `postbox.sender` role in the same Yandex Cloud
folder as the verified address. Never commit the key. Create the Postbox address for the domain
`talents-hub.online` (not for a sender-like subdomain such as `no-reply.talents-hub.online`) and publish both DKIM
CNAME records supplied by Postbox. Add `include:spf.postbox.yandexcloud.net` to the domain's existing
single SPF record before its `all` mechanism; do not create a second SPF record. Keep the existing
DMARC record. After DKIM verifies, send registration and password-reset tests to external mailboxes.

Postbox sends mail but does not host an inbox. REG.RU MX records and the REG.RU mailbox may remain in
place if incoming mail is still required; they are independent from Django's outbound Postbox API.
