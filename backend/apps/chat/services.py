from collections.abc import Iterable
from typing import Any
from uuid import UUID

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from django.core.files.storage import default_storage
from django.db import IntegrityError, models, transaction
from django.db.models import QuerySet
from django.utils import timezone

from apps.audit.models import AuditEvent
from apps.media.models import MediaAsset
from apps.notifications.models import Notification
from apps.organizations.models import Organization, OrganizationMembership
from apps.users.models import User

from .models import ChatMessage, Conversation, ConversationParticipant


def user_group_name(user_id: int) -> str:
    return f"chat_user_{user_id}"


def media_asset_url(asset: MediaAsset | None) -> str | None:
    if asset is None or asset.status != MediaAsset.Status.AVAILABLE:
        return None
    return default_storage.url(asset.storage_key)


def user_avatar_url(user: User) -> str | None:
    try:
        return media_asset_url(user.profile.avatar)
    except ObjectDoesNotExist:
        return None


def organization_logo_url(organization: Organization) -> str | None:
    return media_asset_url(organization.logo)


def message_sender_avatar_url(message: ChatMessage) -> str | None:
    sender_organization = message.sender_organization
    if sender_organization is not None:
        return organization_logo_url(sender_organization)
    return user_avatar_url(message.sender)


def accessible_conversations_for(user: User | int) -> QuerySet[Conversation]:
    user_id = user if isinstance(user, int) else user.id
    return Conversation.objects.filter(deleted_at__isnull=True).filter(
        models.Q(
            participants__user_id=user_id,
            participants__is_direct=True,
            participants__deleted_at__isnull=True,
        )
        | models.Q(
            organization_participants__deleted_at__isnull=True,
            organization_participants__organization__memberships__user_id=user_id,
            organization_participants__organization__memberships__status=(
                OrganizationMembership.Status.ACTIVE
            ),
            organization_participants__organization__memberships__deleted_at__isnull=True,
        )
    ).distinct()


def conversation_user_ids(conversation: Conversation) -> list[int]:
    direct_ids = ConversationParticipant.objects.filter(
        conversation=conversation,
        is_direct=True,
        deleted_at__isnull=True,
    ).values_list("user_id", flat=True)
    organization_member_ids = OrganizationMembership.objects.filter(
        organization__conversation_participations__conversation=conversation,
        organization__conversation_participations__deleted_at__isnull=True,
        status=OrganizationMembership.Status.ACTIVE,
        deleted_at__isnull=True,
    ).values_list("user_id", flat=True)
    return sorted({*direct_ids, *organization_member_ids})


def _message_payload(message: ChatMessage, recipient_id: int) -> dict[str, Any]:
    sender_organization = message.sender_organization
    if sender_organization is not None:
        sender_name = sender_organization.display_name
        sender_profile_slug: str | None = None
        sender_organization_slug: str | None = sender_organization.slug
        sender_kind = "organization"
    else:
        try:
            profile = message.sender.profile
            sender_name = profile.display_name
            sender_profile_slug = profile.slug
        except ObjectDoesNotExist:
            sender_name = message.sender.email
            sender_profile_slug = None
        sender_organization_slug = None
        sender_kind = "talent"

    return {
        "id": str(message.id),
        "sender": message.sender_id,
        "sender_kind": sender_kind,
        "sender_name": sender_name,
        "sender_profile_slug": sender_profile_slug,
        "sender_organization": (
            str(message.sender_organization_id)
            if message.sender_organization_id is not None
            else None
        ),
        "sender_organization_slug": sender_organization_slug,
        "sender_avatar_url": message_sender_avatar_url(message),
        "is_self": message.sender_id == recipient_id,
        "body": message.body,
        "client_message_id": (
            str(message.client_message_id) if message.client_message_id is not None else None
        ),
        "created_at": message.created_at.isoformat(),
    }


def _publish_events(events: Iterable[tuple[int, dict[str, Any]]]) -> None:
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    for user_id, event in events:
        async_to_sync(channel_layer.group_send)(
            user_group_name(user_id),
            {"type": "chat.event", "event": event},
        )


def _notify_after_commit(events: list[tuple[int, dict[str, Any]]]) -> None:
    transaction.on_commit(lambda: _publish_events(events))


@transaction.atomic
def send_message(
    *,
    conversation: Conversation,
    sender: User,
    sender_organization: Organization | None = None,
    body: str,
    client_message_id: UUID | None = None,
) -> ChatMessage:
    if sender_organization is not None:
        organization_is_participant = conversation.organization_participants.filter(
            organization=sender_organization,
            deleted_at__isnull=True,
        ).exists()
        sender_is_member = OrganizationMembership.objects.filter(
            organization=sender_organization,
            user=sender,
            status=OrganizationMembership.Status.ACTIVE,
            deleted_at__isnull=True,
        ).exists()
        if not organization_is_participant or not sender_is_member:
            raise PermissionDenied("You cannot send messages as this organization.")

    if client_message_id is not None:
        existing_message = ChatMessage.objects.filter(
            conversation=conversation,
            sender=sender,
            client_message_id=client_message_id,
            deleted_at__isnull=True,
        ).first()
        if existing_message is not None:
            return existing_message

    try:
        with transaction.atomic():
            message = ChatMessage.objects.create(
                conversation=conversation,
                sender=sender,
                sender_organization=sender_organization,
                body=body,
                client_message_id=client_message_id,
            )
    except IntegrityError:
        if client_message_id is None:
            raise
        return ChatMessage.objects.get(
            conversation=conversation,
            sender=sender,
            client_message_id=client_message_id,
            deleted_at__isnull=True,
        )

    conversation.last_message_at = message.created_at
    conversation.save(update_fields=["last_message_at", "updated_at"])

    participant_ids = conversation_user_ids(conversation)
    recipient_ids = [user_id for user_id in participant_ids if user_id != sender.id]
    Notification.objects.bulk_create(
        [
            Notification(
                recipient_id=str(recipient_id),
                type="chat.message",
                payload={
                    "conversation_id": str(conversation.id),
                    "sender_id": str(sender.id),
                    "sender_email": sender.email,
                    "sender_organization_id": (
                        str(sender_organization.id) if sender_organization is not None else None
                    ),
                    "preview": body[:160],
                },
            )
            for recipient_id in recipient_ids
        ]
    )
    AuditEvent.objects.create(
        actor=sender,
        content_type=ContentType.objects.get_for_model(ChatMessage),
        object_id=message.id,
        action="chat.message_sent",
        after={"conversation_id": str(conversation.id)},
    )
    _notify_after_commit(
        [
            (
                participant_id,
                {
                    "type": "chat.message.created",
                    "conversation_id": str(conversation.id),
                    "message": _message_payload(message, participant_id),
                },
            )
            for participant_id in participant_ids
        ]
    )
    return message


@transaction.atomic
def mark_conversation_read(
    *, conversation: Conversation, user: User
) -> ConversationParticipant:
    read_at = timezone.now()
    participant, _ = ConversationParticipant.objects.get_or_create(
        conversation=conversation,
        user=user,
        defaults={"is_direct": False, "last_read_at": read_at},
    )
    if participant.deleted_at is not None:
        participant.deleted_at = None
    participant.last_read_at = read_at
    participant.save(update_fields=["last_read_at", "deleted_at", "updated_at"])
    Notification.objects.filter(
        recipient=user,
        type="chat.message",
        read_at__isnull=True,
        payload__conversation_id=str(conversation.id),
    ).update(read_at=read_at, updated_at=read_at)

    participant_ids = conversation_user_ids(conversation)
    _notify_after_commit(
        [
            (
                participant_id,
                {
                    "type": "chat.conversation.read",
                    "conversation_id": str(conversation.id),
                    "user_id": user.id,
                    "last_read_at": participant.last_read_at.isoformat(),
                },
            )
            for participant_id in participant_ids
        ]
    )
    return participant
