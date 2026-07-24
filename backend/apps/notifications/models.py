from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.common.models import UUIDTimestampedModel


class Notification(UUIDTimestampedModel):
    class EmailStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"
        SKIPPED = "skipped", "Skipped"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(max_length=128)
    payload = models.JSONField(default=dict)
    read_at = models.DateTimeField(blank=True, null=True)
    email_status = models.CharField(
        choices=EmailStatus.choices,
        default=EmailStatus.PENDING,
        max_length=16,
    )

    class Meta:
        indexes = [models.Index(fields=["recipient", "read_at", "created_at"])]
        ordering = ("-created_at",)

    def mark_read(self) -> None:
        if self.read_at is None:
            self.read_at = timezone.now()
            self.save(update_fields=["read_at", "updated_at"])


from .outbox import OutboxEvent  # noqa: E402

__all__ = ["Notification", "OutboxEvent"]
