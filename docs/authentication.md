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

## REG.RU SMTP

The development configuration writes emails to the backend console. Production uses the REG.RU
mailbox SMTP endpoint:

```dotenv
DJANGO_EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
DEFAULT_FROM_EMAIL=Talents Hub <noreply@talents-hub.online>
EMAIL_HOST=mail.hosting.reg.ru
EMAIL_PORT=465
EMAIL_HOST_USER=noreply@talents-hub.online
SMTP_PASSWORD_FILE=/root/talents-hub-smtp-password
EMAIL_HOST_PASSWORD_FILE=/run/secrets/smtp_password
EMAIL_HOST_PASSWORD=
EMAIL_USE_TLS=false
EMAIL_USE_SSL=true
EMAIL_TIMEOUT=15
```

Keep the mailbox password in the root-owned `SMTP_PASSWORD_FILE` with mode `600`; Docker mounts it
read-only at `EMAIL_HOST_PASSWORD_FILE`. Never commit it or put it directly into a Compose
environment variable. Publish the REG.RU-generated DKIM record and verify the domain's single SPF
record and DMARC policy. After DNS verifies, send registration and password-reset tests to external
mailboxes.
