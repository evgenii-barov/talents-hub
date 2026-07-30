from __future__ import annotations

import argparse
from pathlib import Path
from urllib.parse import urlparse


REQUIRED = (
    "SITE_ADDRESS",
    "WWW_SITE_ADDRESS",
    "PUBLIC_SITE_URL",
    "PUBLIC_API_URL",
    "POSTGRES_DB",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "REDIS_PASSWORD",
    "DJANGO_SECRET_KEY",
    "DJANGO_ALLOWED_HOSTS",
    "DJANGO_CORS_ALLOWED_ORIGINS",
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    "DATABASE_URL",
    "REDIS_URL",
    "CELERY_BROKER_URL",
    "CELERY_RESULT_BACKEND",
    "FRONTEND_URL",
)


def read_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            raise ValueError(f"{path}:{line_number}: expected KEY=VALUE")
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def is_local_url(value: str) -> bool:
    host = urlparse(value).hostname
    return host in {"localhost", "127.0.0.1", "::1"}


def validate(values: dict[str, str], *, strict_external: bool) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    for key in REQUIRED:
        value = values.get(key, "")
        if not value:
            errors.append(f"{key} is required")
        elif "replace-me" in value.lower():
            errors.append(f"{key} still contains a replace-me placeholder")

    secret = values.get("DJANGO_SECRET_KEY", "")
    if len(secret) < 50 or len(set(secret)) < 8 or secret.startswith("django-insecure-"):
        errors.append("DJANGO_SECRET_KEY must be a random value of at least 50 characters")

    if values.get("PUBLIC_API_URL") != "/api":
        errors.append("PUBLIC_API_URL must be /api for same-origin production routing")

    for key in ("PUBLIC_SITE_URL", "FRONTEND_URL"):
        value = values.get(key, "")
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            errors.append(f"{key} must be an absolute HTTP(S) URL")
        elif parsed.path not in {"", "/"} or parsed.params or parsed.query or parsed.fragment:
            errors.append(f"{key} must be an origin without a path, query, or fragment")
        elif parsed.scheme != "https" and not is_local_url(value):
            warnings.append(f"{key} is not HTTPS; use this only before DNS/TLS activation")

    public_url = values.get("PUBLIC_SITE_URL", "").rstrip("/")
    public_parsed = urlparse(public_url)
    public_host = public_parsed.hostname
    frontend_url = values.get("FRONTEND_URL", "").rstrip("/")
    if public_url and frontend_url and frontend_url != public_url:
        errors.append("FRONTEND_URL must match PUBLIC_SITE_URL")

    site_address = values.get("SITE_ADDRESS", "")
    site_parsed = urlparse(site_address if "://" in site_address else f"//{site_address}")
    if not site_parsed.hostname:
        errors.append("SITE_ADDRESS must contain a valid hostname for Caddy")
    elif public_host and site_parsed.hostname != public_host:
        errors.append("SITE_ADDRESS hostname must match PUBLIC_SITE_URL")

    www_site_address = values.get("WWW_SITE_ADDRESS", "")
    www_site_parsed = urlparse(
        www_site_address if "://" in www_site_address else f"//{www_site_address}"
    )
    if not www_site_parsed.hostname:
        errors.append("WWW_SITE_ADDRESS must contain a valid hostname for Caddy")
    elif public_host and www_site_parsed.hostname != f"www.{public_host}":
        errors.append("WWW_SITE_ADDRESS hostname must be www.PUBLIC_SITE_URL hostname")

    allowed_hosts = {host.strip() for host in values.get("DJANGO_ALLOWED_HOSTS", "").split(",")}
    if public_host and public_host not in allowed_hosts:
        errors.append("DJANGO_ALLOWED_HOSTS must include the PUBLIC_SITE_URL hostname")

    for key in ("DJANGO_CORS_ALLOWED_ORIGINS", "DJANGO_CSRF_TRUSTED_ORIGINS"):
        origins = {origin.strip().rstrip("/") for origin in values.get(key, "").split(",")}
        if public_url and public_url not in origins:
            errors.append(f"{key} must include PUBLIC_SITE_URL")

    public_https = public_parsed.scheme == "https"
    if public_https:
        for key in (
            "DJANGO_SECURE_SSL_REDIRECT",
            "DJANGO_SESSION_COOKIE_SECURE",
            "DJANGO_CSRF_COOKIE_SECURE",
        ):
            if values.get(key, "").lower() != "true":
                errors.append(f"{key} must be true for an HTTPS deployment")
        try:
            hsts_seconds = int(values.get("DJANGO_SECURE_HSTS_SECONDS", "0"))
        except ValueError:
            errors.append("DJANGO_SECURE_HSTS_SECONDS must be an integer")
        else:
            if hsts_seconds < 31_536_000:
                errors.append("DJANGO_SECURE_HSTS_SECONDS must be at least 31536000 for HTTPS")

    if "*" in allowed_hosts:
        errors.append("DJANGO_ALLOWED_HOSTS must not contain a wildcard")

    if "@db:" not in values.get("DATABASE_URL", ""):
        errors.append("DATABASE_URL must use the internal Docker host db")
    for key in ("REDIS_URL", "CELERY_BROKER_URL", "CELERY_RESULT_BACKEND"):
        if "@redis:" not in values.get(key, ""):
            errors.append(f"{key} must use the password-protected internal Docker host redis")

    if values.get("DJANGO_EMAIL_BACKEND", "").endswith("console.EmailBackend"):
        message = "SMTP is not configured; registration emails will only appear in backend logs"
        (errors if strict_external else warnings).append(message)
    if values.get("USE_S3", "false").lower() != "true":
        warnings.append("S3 is not configured; uploads will use the persistent server volume")
    if not values.get("SENTRY_DSN"):
        warnings.append("Sentry is not configured; rely on container logs until it is connected")

    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Talents Hub production configuration.")
    parser.add_argument("env_file", type=Path, nargs="?", default=Path(".env.production"))
    parser.add_argument(
        "--strict-external",
        action="store_true",
        help="Fail when SMTP is not configured (use immediately before public launch).",
    )
    args = parser.parse_args()

    if not args.env_file.is_file():
        print(f"ERROR: environment file not found: {args.env_file}")
        return 1

    try:
        values = read_env(args.env_file)
    except (OSError, UnicodeError, ValueError) as exc:
        print(f"ERROR: {exc}")
        return 1

    errors, warnings = validate(values, strict_external=args.strict_external)
    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")

    if errors:
        print(f"Preflight failed with {len(errors)} error(s).")
        return 1
    print("Preflight passed. No secret values were printed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
