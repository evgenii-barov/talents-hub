from .base import *  # noqa: F403

MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")  # noqa: F405
DEBUG = False
SOCIAL_AUTH_ENABLED = env.bool("SOCIAL_AUTH_ENABLED", default=False)  # noqa: F405
if not SOCIAL_AUTH_ENABLED:
    for provider_settings in SOCIALACCOUNT_PROVIDERS.values():  # noqa: F405
        provider_settings["APPS"] = []
if "backend" not in ALLOWED_HOSTS:  # noqa: F405
    ALLOWED_HOSTS.append("backend")  # noqa: F405
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=True)  # noqa: F405
SESSION_COOKIE_SECURE = env.bool("DJANGO_SESSION_COOKIE_SECURE", default=True)  # noqa: F405
CSRF_COOKIE_SECURE = env.bool("DJANGO_CSRF_COOKIE_SECURE", default=True)  # noqa: F405
SECURE_HSTS_SECONDS = env.int("DJANGO_SECURE_HSTS_SECONDS", default=31_536_000)  # noqa: F405
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
WHITENOISE_MAX_AGE = 31_536_000
