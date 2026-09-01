from pathlib import Path
from unittest import TestCase

from production_preflight import read_env, validate


def valid_values() -> dict[str, str]:
    values = read_env(Path(__file__).resolve().parents[1] / ".env.production.example")
    postgres_password = "a" * 32
    redis_password = "b" * 32
    glitchtip_password = "f" * 32
    umami_password = "1" * 32
    values.update(
        {
            "POSTGRES_PASSWORD": postgres_password,
            "REDIS_PASSWORD": redis_password,
            "DJANGO_SECRET_KEY": "cdef0123456789" * 5,
            "DATABASE_URL": (
                f"postgresql://talents_hub:{postgres_password}@db:5432/talents_hub"
            ),
            "REDIS_URL": f"redis://:{redis_password}@redis:6379/1",
            "CELERY_BROKER_URL": f"redis://:{redis_password}@redis:6379/0",
            "CELERY_RESULT_BACKEND": f"redis://:{redis_password}@redis:6379/0",
            "YANDEX_POSTBOX_ACCESS_KEY_ID": "postbox-key-id",
            "YANDEX_POSTBOX_SECRET_KEY": "d" * 40,
            "GLITCHTIP_SECRET_KEY": "ef0123456789abcd" * 4,
            "GLITCHTIP_POSTGRES_PASSWORD": glitchtip_password,
            "GLITCHTIP_DATABASE_URL": (
                f"postgresql://glitchtip:{glitchtip_password}@glitchtip-db:5432/glitchtip"
            ),
            "UMAMI_POSTGRES_PASSWORD": umami_password,
            "UMAMI_DATABASE_URL": (
                f"postgresql://umami:{umami_password}@umami-db:5432/umami"
            ),
            "UMAMI_APP_SECRET": "23456789abcdef01" * 4,
            "UMAMI_TWO_FACTOR_ENCRYPTION_KEY": "3" * 64,
            "UMAMI_WEBSITE_ID": "94db1cb1-74f4-4a40-ad6c-962362670409",
        }
    )
    return values


class ProductionPreflightTests(TestCase):
    def test_example_becomes_valid_when_secrets_and_website_are_configured(self) -> None:
        errors, _warnings = validate(valid_values(), strict_external=True)

        self.assertEqual(errors, [])

    def test_umami_website_id_must_be_a_uuid(self) -> None:
        values = valid_values()
        values["UMAMI_WEBSITE_ID"] = "not-a-uuid"

        errors, _warnings = validate(values, strict_external=True)

        self.assertIn("UMAMI_WEBSITE_ID must be a canonical UUID", errors)

    def test_umami_must_use_a_separate_host(self) -> None:
        values = valid_values()
        values["ANALYTICS_SITE_ADDRESS"] = values["PUBLIC_SITE_URL"]
        values["UMAMI_SCRIPT_URL"] = f'{values["PUBLIC_SITE_URL"]}/th.js'

        errors, _warnings = validate(values, strict_external=True)

        self.assertIn("ANALYTICS_SITE_ADDRESS must use a separate hostname", errors)
