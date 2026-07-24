from typing import Any

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models import Q
from django.utils import timezone

from apps.common.models import UUIDTimestampedModel


class ModerationCase(UUIDTimestampedModel):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        IN_REVIEW = "in_review", "In review"
        APPROVED = "approved", "Approved"
        CHANGES_REQUESTED = "changes_requested", "Changes requested"
        REJECTED = "rejected", "Rejected"
        CLOSED = "closed", "Closed"

    content_type = models.ForeignKey(ContentType, on_delete=models.PROTECT)
    object_id = models.UUIDField()
    target = GenericForeignKey("content_type", "object_id")
    status = models.CharField(choices=Status.choices, default=Status.OPEN, max_length=32)
    reason_code = models.CharField(max_length=64, default="publication_review")
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="reported_moderation_cases",
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="assigned_moderation_cases",
    )
    decision_note = models.TextField(blank=True)
    opened_at = models.DateTimeField(default=timezone.now)
    resolved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["content_type", "object_id"],
                condition=Q(status__in=("open", "in_review")),
                name="moderation_one_active_case_per_target",
            ),
        ]
        indexes = [
            models.Index(fields=["status", "opened_at"]),
            models.Index(fields=["content_type", "object_id"]),
        ]
        ordering = ("opened_at",)

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.status in {
            self.Status.APPROVED,
            self.Status.CHANGES_REQUESTED,
            self.Status.REJECTED,
            self.Status.CLOSED,
        } and self.resolved_at is None:
            self.resolved_at = timezone.now()
        super().save(*args, **kwargs)
