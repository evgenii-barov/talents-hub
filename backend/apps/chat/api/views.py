from django.db import transaction
from django.db.models import Q, QuerySet
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.chat.models import (
    Conversation,
    ConversationOrganization,
    ConversationParticipant,
)
from apps.organizations.models import Organization, OrganizationMembership
from apps.profiles.models import Profile
from apps.projects.models import Project, ProjectStatus

from ..services import accessible_conversations_for, mark_conversation_read, send_message
from .serializers import (
    ChatMessageSerializer,
    ChatMessageWriteSerializer,
    ConversationSerializer,
    CreateConversationSerializer,
)


class ConversationAccessMixin:
    permission_classes = (permissions.IsAuthenticated,)

    def get_conversation(self, request: Request, conversation_id: str) -> Conversation:
        return get_object_or_404(
            accessible_conversations_for(request.user).select_related("project"),
            pk=conversation_id,
        )

    def get_sender_organization(
        self,
        request: Request,
        conversation: Conversation,
        organization_id: str | None,
    ) -> Organization | None:
        if organization_id is None:
            return None
        return get_object_or_404(
            Organization.objects.filter(
                pk=organization_id,
                conversation_participations__conversation=conversation,  # type: ignore[misc]
                conversation_participations__deleted_at__isnull=True,
                memberships__user=request.user,
                memberships__status=OrganizationMembership.Status.ACTIVE,
                memberships__deleted_at__isnull=True,
            ).distinct()
        )


class ConversationListView(ConversationAccessMixin, APIView):
    def get_queryset(self, request: Request) -> QuerySet[Conversation]:
        return (
            accessible_conversations_for(request.user)
            .select_related("project")
            .prefetch_related("participants__user__profile__avatar")
            .prefetch_related("organization_participants__organization__logo")
        )

    def get(self, request: Request) -> Response:
        serializer = ConversationSerializer(
            self.get_queryset(request),
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    @transaction.atomic
    def post(self, request: Request) -> Response:
        serializer = CreateConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile_ids = set(serializer.validated_data["participant_profile_ids"])
        organization_ids = set(serializer.validated_data["organization_ids"])
        profiles = Profile.objects.public().filter(pk__in=profile_ids).select_related("user")
        if profiles.count() != len(profile_ids):
            raise ValidationError(
                {"participant_profile_ids": "Every recipient must have a public profile."}
            )
        recipient_ids = {
            profile.user_id for profile in profiles if profile.user_id != request.user.id
        }
        organizations = Organization.objects.public().filter(pk__in=organization_ids)
        if organizations.count() != len(organization_ids):
            raise ValidationError(
                {"organization_ids": "Every organization must be public."}
            )
        organization_member_ids = set(
            OrganizationMembership.objects.filter(
                organization_id__in=organization_ids,
                status=OrganizationMembership.Status.ACTIVE,
                deleted_at__isnull=True,
            ).values_list("user_id", flat=True)
        )
        if not ({*recipient_ids, *organization_member_ids} - {request.user.id}):
            raise ValidationError(
                {"participants": "Choose at least one reachable participant."}
            )

        project = None
        project_id = serializer.validated_data.get("project_id")
        if project_id is not None:
            project = get_object_or_404(
                Project.objects.filter(deleted_at__isnull=True).filter(
                    Q(status=ProjectStatus.PUBLISHED) | Q(owner=request.user)
                ),
                pk=project_id,
            )
        if len(organization_ids) == 0 and len(recipient_ids) == 1:
            kind = Conversation.Kind.DIRECT
        elif len(organization_ids) == 1 and len(recipient_ids) == 0:
            kind = Conversation.Kind.ORGANIZATION
        else:
            kind = Conversation.Kind.GROUP

        conversation = Conversation.objects.create(
            project=project,
            created_by=request.user,
            kind=kind,
            subject=serializer.validated_data.get("subject", ""),
        )
        ConversationParticipant.objects.bulk_create(
            [
                ConversationParticipant(conversation=conversation, user_id=user_id)
                for user_id in {request.user.id, *recipient_ids}
            ]
        )
        ConversationOrganization.objects.bulk_create(
            [
                ConversationOrganization(
                    conversation=conversation,
                    organization=organization,
                )
                for organization in organizations
            ]
        )
        sender_organization = self.get_sender_organization(
            request,
            conversation,
            serializer.validated_data.get("sender_organization_id"),
        )
        send_message(
            conversation=conversation,
            sender=request.user,
            sender_organization=sender_organization,
            body=serializer.validated_data["message"],
        )
        return Response(
            ConversationSerializer(conversation, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ConversationMessagesView(ConversationAccessMixin, APIView):
    def get(self, request: Request, conversation_id: str) -> Response:
        conversation = self.get_conversation(request, conversation_id)
        messages = conversation.messages.filter(deleted_at__isnull=True).select_related(
            "sender__profile__avatar", "sender_organization__logo"
        )
        serializer = ChatMessageSerializer(messages, many=True, context={"request": request})
        return Response(serializer.data)

    @transaction.atomic
    def post(self, request: Request, conversation_id: str) -> Response:
        conversation = self.get_conversation(request, conversation_id)
        serializer = ChatMessageWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sender_organization = self.get_sender_organization(
            request,
            conversation,
            serializer.validated_data.get("sender_organization_id"),
        )
        message = send_message(
            conversation=conversation,
            sender=request.user,
            sender_organization=sender_organization,
            body=serializer.validated_data["body"],
            client_message_id=serializer.validated_data.get("client_message_id"),
        )
        return Response(
            ChatMessageSerializer(message, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ConversationReadView(ConversationAccessMixin, APIView):
    def post(self, request: Request, conversation_id: str) -> Response:
        conversation = self.get_conversation(request, conversation_id)
        mark_conversation_read(conversation=conversation, user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
