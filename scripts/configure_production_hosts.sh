#!/usr/bin/env bash
set -euo pipefail

env_file="${1:-.env.production}"

if [[ ! -f "$env_file" ]]; then
  printf 'Environment file not found: %s\n' "$env_file" >&2
  exit 1
fi

get_env() {
  local key="$1"
  sed -n "s/^${key}=//p" "$env_file" | tail -n 1
}

set_env() {
  local key="$1"
  local value="$2"
  local temp_file
  temp_file="$(mktemp "${env_file}.XXXXXX")"
  awk -v key="$key" -v value="$value" '
    BEGIN { found = 0 }
    $0 ~ "^" key "=" {
      if (!found) {
        print key "=" value
        found = 1
      }
      next
    }
    { print }
    END {
      if (!found) print key "=" value
    }
  ' "$env_file" > "$temp_file"
  chmod --reference="$env_file" "$temp_file"
  mv "$temp_file" "$env_file"
}

ensure_secret() {
  local key="$1"
  local value
  value="$(get_env "$key")"
  if [[ -z "$value" || "$value" == *replace-me* ]]; then
    value="$(openssl rand -hex 32)"
    set_env "$key" "$value"
  fi
}

set_env ADMIN_SITE_ADDRESS https://admin.talents-hub.online
set_env DJANGO_ALLOWED_HOSTS talents-hub.online,www.talents-hub.online,admin.talents-hub.online
set_env DJANGO_CSRF_TRUSTED_ORIGINS https://talents-hub.online,https://admin.talents-hub.online

set_env GLITCHTIP_DOMAIN https://errors.talents-hub.online
set_env GLITCHTIP_ALLOWED_HOSTS errors.talents-hub.online
set_env GLITCHTIP_CSRF_TRUSTED_ORIGINS https://errors.talents-hub.online
set_env GLITCHTIP_POSTGRES_DB glitchtip
set_env GLITCHTIP_POSTGRES_USER glitchtip
set_env GLITCHTIP_DEFAULT_FROM_EMAIL errors@talents-hub.online
ensure_secret GLITCHTIP_SECRET_KEY
ensure_secret GLITCHTIP_POSTGRES_PASSWORD

glitchtip_password="$(get_env GLITCHTIP_POSTGRES_PASSWORD)"
set_env GLITCHTIP_DATABASE_URL \
  "postgresql://glitchtip:${glitchtip_password}@glitchtip-db:5432/glitchtip"
set_env SENTRY_ENVIRONMENT production
set_env SENTRY_RELEASE "backend@$(git rev-parse --short HEAD)"
set_env SENTRY_TRACES_SAMPLE_RATE 0.01
set_env SENTRY_PROFILES_SAMPLE_RATE 0.0

chmod 600 "$env_file"
printf 'Production admin and GlitchTip hosts configured in %s (secret values were not printed).\n' \
  "$env_file"
