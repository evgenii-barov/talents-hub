from typing import Any
from uuid import UUID

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.core.exceptions import PermissionDenied

from apps.chat.models import Conversation
from apps.organizations.models import Organization
from apps.users.models import User

from .services import (
    accessible_conversations_for,
    mark_conversation_read,
    send_message,
    user_group_name,
)

MAX_MESSAGE_LENGTH = 4000


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """Authenticated realtime delivery and write channel for private conversations."""

    user_id: int
    group_name: str

    async def connect(self) -> None:
        user = self.scope.get("user")
        if user is None or not user.is_authenticated:
            await self.close(code=4401)
            return

        self.user_id = user.id
        self.group_name = user_group_name(self.user_id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code: int) -> None:
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content: dict[str, Any], **kwargs: Any) -> None:
        event_type = content.get("type")
        if event_type == "chat.message.send":
            await self._send_message(content)
            return
        if event_type == "chat.conversation.read":
            await self._mark_conversation_read(content)
            return
        await self._send_error("unsupported_event", "Unsupported WebSocket event.")

    async def chat_event(self, event: dict[str, Any]) -> None:
        await self.send_json(event["event"])

    async def _send_message(self, content: dict[str, Any]) -> None:
        conversation_id = self._uuid_from_content(content, "conversation_id")
        body = content.get("body")
        client_message_id = self._uuid_from_content(content, "client_message_id")
        sender_organization_id = self._optional_uuid_from_content(
            content, "sender_organization_id"
        )
        if conversation_id is None or client_message_id is None:
            await self._send_error(
                "invalid_message", "Conversation and client message IDs are required."
            )
            return
        if content.get("sender_organization_id") is not None and sender_organization_id is None:
            await self._send_error("invalid_message", "Organization ID is invalid.")
            return
        if not isinstance(body, str) or not (body := body.strip()):
            await self._send_error("invalid_message", "Message cannot be empty.")
            return
        if len(body) > MAX_MESSAGE_LENGTH:
            await self._send_error("invalid_message", "Message is too long.")
            return

        try:
            await self._create_message(
                conversation_id,
                body,
                client_message_id,
                sender_organization_id,
            )
        except Conversation.DoesNotExist:
            await self._send_error("conversation_not_found", "Conversation was not found.")
        except PermissionDenied:
            await self._send_error(
                "organization_sender_forbidden",
                "You cannot send messages as this organization.",
            )

    async def _mark_conversation_read(self, content: dict[str, Any]) -> None:
        conversation_id = self._uuid_from_content(content, "conversation_id")
        if conversation_id is None:
            await self._send_error("invalid_read_receipt", "Conversation ID is required.")
            return
        try:
            await self._read_conversation(conversation_id)
        except Conversation.DoesNotExist:
            await self._send_error("conversation_not_found", "Conversation was not found.")

    @database_sync_to_async
    def _create_message(
        self,
        conversation_id: UUID,
        body: str,
        client_message_id: UUID,
        sender_organization_id: UUID | None,
    ) -> None:
        conversation = accessible_conversations_for(self.user_id).get(pk=conversation_id)
        sender = User.objects.get(pk=self.user_id)
        sender_organization = None
        if sender_organization_id is not None:
            sender_organization = Organization.objects.filter(
                pk=sender_organization_id
            ).first()
            if sender_organization is None:
                raise PermissionDenied
        send_message(
            conversation=conversation,
            sender=sender,
            sender_organization=sender_organization,
            body=body,
            client_message_id=client_message_id,
        )

    @database_sync_to_async
    def _read_conversation(self, conversation_id: UUID) -> None:
        conversation = accessible_conversations_for(self.user_id).get(pk=conversation_id)
        user = User.objects.get(pk=self.user_id)
        mark_conversation_read(conversation=conversation, user=user)

    @staticmethod
    def _uuid_from_content(content: dict[str, Any], key: str) -> UUID | None:
        try:
            return UUID(str(content[key]))
        except (KeyError, TypeError, ValueError):
            return None

    @staticmethod
    def _optional_uuid_from_content(content: dict[str, Any], key: str) -> UUID | None:
        value = content.get(key)
        if value is None:
            return None
        try:
            return UUID(str(value))
        except (TypeError, ValueError):
            return None

    async def _send_error(self, code: str, detail: str) -> None:
        await self.send_json({"type": "chat.error", "code": code, "detail": detail})
