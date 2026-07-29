from typing import Any

from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

from apps.chat.models import (
    ChatMessage,
    Conversation,
    ConversationOrganization,
    ConversationParticipant,
)
from apps.organizations.models import OrganizationMembership
from apps.projects.models import Project

from ..services import (
    message_sender_avatar_url,
    organization_logo_url,
    user_avatar_url,
)


class ConversationProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "slug", "title", "short_description")


class ConversationParticipantSerializer(serializers.ModelSerializer):
    kind = serializers.SerializerMethodField()
    entity_id = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    profile_slug = serializers.SerializerMethodField()
    organization_slug = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    is_self = serializers.SerializerMethodField()

    class Meta:
        model = ConversationParticipant
        fields = (
            "id",
            "kind",
            "entity_id",
            "display_name",
            "profile_slug",
            "organization_slug",
            "avatar_url",
            "is_self",
            "last_read_at",
        )

    def get_kind(self, participant: ConversationParticipant) -> str:
        return "talent"

    def get_entity_id(self, participant: ConversationParticipant) -> str:
        try:
            return str(participant.user.profile.id)
        except ObjectDoesNotExist:
            return str(participant.user_id)

    def get_display_name(self, participant: ConversationParticipant) -> str:
        try:
            return str(participant.user.profile.display_name)
        except ObjectDoesNotExist:
            return str(participant.user.email)

    def get_profile_slug(self, participant: ConversationParticipant) -> str | None:
        try:
            return str(participant.user.profile.slug)
        except ObjectDoesNotExist:
            return None

    def get_organization_slug(self, participant: ConversationParticipant) -> None:
        return None

    def get_avatar_url(self, participant: ConversationParticipant) -> str | None:
        return user_avatar_url(participant.user)

    def get_is_self(self, participant: ConversationParticipant) -> bool:
        request = self.context.get("request")
        return bool(
            request and request.user.is_authenticated and participant.user_id == request.user.id
        )


class ConversationOrganizationSerializer(serializers.ModelSerializer):
    kind = serializers.SerializerMethodField()
    entity_id = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    profile_slug = serializers.SerializerMethodField()
    organization_slug = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    is_self = serializers.SerializerMethodField()
    last_read_at = serializers.SerializerMethodField()

    class Meta:
        model = ConversationOrganization
        fields = (
            "id",
            "kind",
            "entity_id",
            "display_name",
            "profile_slug",
            "organization_slug",
            "avatar_url",
            "is_self",
            "last_read_at",
        )

    def get_kind(self, participant: ConversationOrganization) -> str:
        return "organization"

    def get_entity_id(self, participant: ConversationOrganization) -> str:
        return str(participant.organization_id)

    def get_display_name(self, participant: ConversationOrganization) -> str:
        return str(participant.organization.display_name)

    def get_profile_slug(self, participant: ConversationOrganization) -> None:
        return None

    def get_organization_slug(self, participant: ConversationOrganization) -> str:
        return str(participant.organization.slug)

    def get_avatar_url(self, participant: ConversationOrganization) -> str | None:
        return organization_logo_url(participant.organization)

    def get_is_self(self, participant: ConversationOrganization) -> bool:
        request = self.context.get("request")
        return bool(
            request
            and request.user.is_authenticated
            and OrganizationMembership.objects.filter(
                organization=participant.organization,
                user=request.user,
                status=OrganizationMembership.Status.ACTIVE,
                deleted_at__isnull=True,
            ).exists()
        )

    def get_last_read_at(self, participant: ConversationOrganization) -> None:
        return None


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_kind = serializers.SerializerMethodField()
    sender_name = serializers.SerializerMethodField()
    sender_profile_slug = serializers.SerializerMethodField()
    sender_organization_slug = serializers.SerializerMethodField()
    sender_avatar_url = serializers.SerializerMethodField()
    is_self = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = (
            "id",
            "sender",
            "sender_kind",
            "sender_name",
            "sender_profile_slug",
            "sender_organization",
            "sender_organization_slug",
            "sender_avatar_url",
            "is_self",
            "body",
            "client_message_id",
            "created_at",
        )

    def get_sender_kind(self, message: ChatMessage) -> str:
        return "organization" if message.sender_organization_id else "talent"

    def get_sender_name(self, message: ChatMessage) -> str:
        sender_organization = message.sender_organization
        if sender_organization is not None:
            return str(sender_organization.display_name)
        try:
            return str(message.sender.profile.display_name)
        except ObjectDoesNotExist:
            return str(message.sender.email)

    def get_sender_profile_slug(self, message: ChatMessage) -> str | None:
        if message.sender_organization is not None:
            return None
        try:
            return str(message.sender.profile.slug)
        except ObjectDoesNotExist:
            return None

    def get_sender_organization_slug(self, message: ChatMessage) -> str | None:
        sender_organization = message.sender_organization
        return str(sender_organization.slug) if sender_organization is not None else None

    def get_sender_avatar_url(self, message: ChatMessage) -> str | None:
        return message_sender_avatar_url(message)

    def get_is_self(self, message: ChatMessage) -> bool:
        request = self.context.get("request")
        return bool(
            request and request.user.is_authenticated and message.sender_id == request.user.id
        )


class ConversationSerializer(serializers.ModelSerializer):
    project = ConversationProjectSerializer(read_only=True)
    participants = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            "id",
            "kind",
            "subject",
            "project",
            "participants",
            "last_message",
            "last_message_at",
            "unread_count",
            "created_at",
        )

    def get_participants(self, conversation: Conversation) -> Any:
        people = (
            conversation.participants.filter(is_direct=True, deleted_at__isnull=True)
            .select_related("user__profile__avatar")
        )
        organizations = conversation.organization_participants.filter(
            deleted_at__isnull=True
        ).select_related("organization__logo")
        people_data = ConversationParticipantSerializer(
            people,
            many=True,
            context={"request": self.context.get("request")},
        ).data
        organization_data = ConversationOrganizationSerializer(
            organizations,
            many=True,
            context={"request": self.context.get("request")},
        ).data
        return [*people_data, *organization_data]

    def get_last_message(self, conversation: Conversation) -> Any:
        message = (
            conversation.messages.filter(deleted_at__isnull=True)
            .select_related(
                "sender__profile__avatar",
                "sender_organization__logo",
            )
            .last()
        )
        return (
            ChatMessageSerializer(message, context={"request": self.context.get("request")}).data
            if message is not None
            else None
        )

    def get_unread_count(self, conversation: Conversation) -> int:
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return 0
        participant = conversation.participants.filter(
            user=request.user,
            deleted_at__isnull=True,
        ).first()
        messages = conversation.messages.filter(deleted_at__isnull=True).exclude(
            sender=request.user
        )
        if participant is not None and participant.last_read_at is not None:
            messages = messages.filter(created_at__gt=participant.last_read_at)
        return messages.count()


class CreateConversationSerializer(serializers.Serializer):
    participant_profile_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list,
        allow_empty=True,
        max_length=20,
    )
    organization_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list,
        allow_empty=True,
        max_length=20,
    )
    project_id = serializers.UUIDField(required=False)
    subject = serializers.CharField(required=False, allow_blank=True, max_length=255)
    message = serializers.CharField(trim_whitespace=True, max_length=4000)
    sender_organization_id = serializers.UUIDField(required=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not attrs["participant_profile_ids"] and not attrs["organization_ids"]:
            raise serializers.ValidationError("Choose at least one participant.")
        return attrs


class ChatMessageWriteSerializer(serializers.Serializer):
    body = serializers.CharField(trim_whitespace=True, max_length=4000)
    client_message_id = serializers.UUIDField(required=False)
    sender_organization_id = serializers.UUIDField(required=False)

    def validate_body(self, body: str) -> str:
        if not body:
            raise serializers.ValidationError("Message cannot be empty.")
        return body
