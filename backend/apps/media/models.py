from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.common.models import UUIDTimestampedModel


class MediaAsset(UUIDTimestampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        AVAILABLE = "available", "Available"
        QUARANTINED = "quarantined", "Quarantined"
        REJECTED = "rejected", "Rejected"
        DELETED = "deleted", "Deleted"

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="uploaded_media_assets",
    )
    storage_key = models.CharField(max_length=512, unique=True)
    original_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=127)
    size_bytes = models.PositiveBigIntegerField()
    checksum = models.CharField(max_length=128)
    status = models.CharField(choices=Status.choices, default=Status.PENDING, max_length=16)
    scan_result = models.TextField(blank=True)
    width = models.PositiveIntegerField(blank=True, null=True)
    height = models.PositiveIntegerField(blank=True, null=True)
    alt_text = models.CharField(max_length=255, blank=True)

    class Meta:
        indexes = [models.Index(fields=["uploaded_by", "status"])]


class MediaAttachment(UUIDTimestampedModel):
    class Purpose(models.TextChoices):
        AVATAR = "avatar", "Avatar"
        LOGO = "logo", "Logo"
        PROJECT_COVER = "project_cover", "Project cover"
        DOCUMENT = "document", "Document"
        CREDENTIAL = "credential", "Credential"

    asset = models.ForeignKey(MediaAsset, on_delete=models.CASCADE, related_name="attachments")
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey("content_type", "object_id")
    purpose = models.CharField(choices=Purpose.choices, max_length=32)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["asset", "content_type", "object_id", "purpose"],
                name="media_unique_attachment_purpose",
            ),
        ]
        indexes = [models.Index(fields=["content_type", "object_id", "purpose"])]
