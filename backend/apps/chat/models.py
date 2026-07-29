from typing import TYPE_CHECKING
from uuid import UUID

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone

from apps.common.models import SoftDeleteModel
from apps.organizations.models import Organization
from apps.projects.models import Project


class Conversation(SoftDeleteModel):
    """Private discussion between two or more members, optionally linked to a project."""

    class Kind(models.TextChoices):
        DIRECT = "direct", "Direct"
        ORGANIZATION = "organization", "Organization"
        GROUP = "group", "Group"

    project = models.ForeignKey(
        Project,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="conversations",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_conversations",
    )
    kind = models.CharField(choices=Kind.choices, default=Kind.DIRECT, max_length=16)
    subject = models.CharField(max_length=255, blank=True)
    last_message_at = models.DateTimeField(blank=True, null=True)

    if TYPE_CHECKING:
        participants: models.Manager["ConversationParticipant"]
        organization_participants: models.Manager["ConversationOrganization"]
        messages: models.Manager["ChatMessage"]

    class Meta:
        indexes = [models.Index(fields=["last_message_at"], name="chat_conversation_last_msg_idx")]
        ordering = ("-last_message_at", "-created_at")


class ConversationParticipant(SoftDeleteModel):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="participants",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversation_participations",
    )
    is_direct = models.BooleanField(
        default=True,
        help_text="Visible participant; false for organization-member read state.",
    )
    joined_at = models.DateTimeField(default=timezone.now)
    last_read_at = models.DateTimeField(blank=True, null=True)

    if TYPE_CHECKING:
        user_id: int

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["conversation", "user"],
                condition=Q(deleted_at__isnull=True),
                name="chat_unique_active_participant",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "deleted_at"], name="chat_participant_user_idx"),
        ]


class ConversationOrganization(SoftDeleteModel):
    """An organization represented in a conversation by its active members."""

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="organization_participants",
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="conversation_participations",
    )
    joined_at = models.DateTimeField(default=timezone.now)

    if TYPE_CHECKING:
        organization_id: UUID

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["conversation", "organization"],
                condition=Q(deleted_at__isnull=True),
                name="chat_unique_active_organization",
            ),
        ]
        indexes = [
            models.Index(
                fields=["organization", "deleted_at"],
                name="chat_participant_org_idx",
            ),
        ]


class ChatMessage(SoftDeleteModel):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="sent_chat_messages",
    )
    sender_organization = models.ForeignKey(
        Organization,
        blank=True,
        null=True,
        on_delete=models.PROTECT,
        related_name="sent_chat_messages",
    )
    body = models.TextField(max_length=4000)
    client_message_id = models.UUIDField(blank=True, null=True)

    if TYPE_CHECKING:
        sender_id: int
        sender_organization_id: UUID | None

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["conversation", "sender", "client_message_id"],
                condition=Q(deleted_at__isnull=True, client_message_id__isnull=False),
                name="chat_unique_active_client_message",
            ),
        ]
        indexes = [
            models.Index(
                fields=["conversation", "created_at"],
                name="chat_message_conversation_idx",
            ),
        ]
        ordering = ("created_at",)
