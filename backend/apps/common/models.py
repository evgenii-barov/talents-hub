import uuid

from django.conf import settings
from django.db import models


class UUIDTimestampedModel(models.Model):
    """Base for domain entities exposed through the platform API."""

    id = models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteModel(UUIDTimestampedModel):
    """Retains records that must stay available to audit trails."""

    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        abstract = True


class PublicationStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PENDING_MODERATION = "pending_moderation", "Pending moderation"
    PUBLISHED = "published", "Published"
    CHANGES_REQUESTED = "changes_requested", "Changes requested"
    ARCHIVED = "archived", "Archived"
    REJECTED = "rejected", "Rejected"


class PublishableModel(SoftDeleteModel):
    """Shared moderation state for profiles, organizations, and projects."""

    status = models.CharField(
        choices=PublicationStatus.choices,
        default=PublicationStatus.DRAFT,
        max_length=32,
    )
    published_at = models.DateTimeField(blank=True, null=True)
    moderated_at = models.DateTimeField(blank=True, null=True)
    moderated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="%(app_label)s_%(class)s_moderated",
    )
    moderation_note = models.TextField(blank=True)

    class Meta:
        abstract = True
