from typing import Any

from django.utils import timezone

from .models import LegalAcceptance, User

TERMS_VERSION = "2026-09-01"
PERSONAL_DATA_VERSION = "2026-09-01"
MINORS_VERSION = "2026-09-01"
PUBLIC_PROFILE_VERSION = "2026-09-01"


def record_legal_acceptance(
    user: User,
    document: str,
    version: str,
    *,
    source: str = "web",
    evidence: dict[str, Any] | None = None,
) -> LegalAcceptance:
    LegalAcceptance.objects.filter(
        user=user,
        document=document,
        withdrawn_at__isnull=True,
    ).update(withdrawn_at=timezone.now())
    return LegalAcceptance.objects.create(
        user=user,
        document=document,
        version=version,
        source=source,
        evidence=evidence or {},
    )


def withdraw_legal_acceptance(user: User, document: str) -> None:
    LegalAcceptance.objects.filter(
        user=user,
        document=document,
        withdrawn_at__isnull=True,
    ).update(withdrawn_at=timezone.now())
