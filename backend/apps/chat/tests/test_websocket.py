import pytest
from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator
from django.test import Client
from django.utils import timezone

from apps.chat.models import ChatMessage, Conversation, ConversationParticipant
from apps.common.models import PublicationStatus
from apps.profiles.models import Profile
from apps.users.models import User
from config.asgi import application


def _authenticated_communicator(client: Client) -> WebsocketCommunicator:
    return WebsocketCommunicator(
        application,
        "/ws/chat/",
        headers=[
            (b"origin", b"http://localhost"),
            (b"cookie", f"sessionid={client.cookies['sessionid'].value}".encode()),
        ],
    )


@pytest.mark.django_db(transaction=True)
def test_authenticated_participants_receive_messages_and_read_receipts() -> None:
    sender = User.objects.create_user(email="sender@example.com", password="test-password")
    recipient = User.objects.create_user(email="recipient@example.com", password="test-password")
    Profile.objects.create(
        user=sender,
        slug="sender-websocket",
        display_name="Sender",
        visibility=Profile.Visibility.PUBLIC,
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
    )
    Profile.objects.create(
        user=recipient,
        slug="recipient-websocket",
        display_name="Recipient",
        visibility=Profile.Visibility.PUBLIC,
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
    )
    conversation = Conversation.objects.create(created_by=sender)
    ConversationParticipant.objects.bulk_create(
        [
            ConversationParticipant(conversation=conversation, user=sender),
            ConversationParticipant(conversation=conversation, user=recipient),
        ]
    )
    sender_client = Client()
    sender_client.force_login(sender)
    recipient_client = Client()
    recipient_client.force_login(recipient)

    async_to_sync(_assert_realtime_flow)(
        _authenticated_communicator(sender_client),
        _authenticated_communicator(recipient_client),
        str(conversation.id),
    )


async def _assert_realtime_flow(
    sender_socket: WebsocketCommunicator,
    recipient_socket: WebsocketCommunicator,
    conversation_id: str,
) -> None:
    sender_connected, _ = await sender_socket.connect()
    recipient_connected, _ = await recipient_socket.connect()
    assert sender_connected is True
    assert recipient_connected is True

    client_message_id = "e398a705-59a7-4eb4-b9e7-5b8611adad1c"
    await sender_socket.send_json_to(
        {
            "type": "chat.message.send",
            "conversation_id": conversation_id,
            "client_message_id": client_message_id,
            "body": "Realtime hello",
        }
    )
    sender_event = await sender_socket.receive_json_from(timeout=1)
    recipient_event = await recipient_socket.receive_json_from(timeout=1)

    assert sender_event["type"] == "chat.message.created"
    assert sender_event["message"]["is_self"] is True
    assert recipient_event["message"]["is_self"] is False
    assert recipient_event["message"]["client_message_id"] == client_message_id

    await sender_socket.send_json_to(
        {
            "type": "chat.message.send",
            "conversation_id": conversation_id,
            "client_message_id": client_message_id,
            "body": "Realtime hello",
        }
    )
    assert await database_sync_to_async(ChatMessage.objects.count)() == 1

    await recipient_socket.send_json_to(
        {"type": "chat.conversation.read", "conversation_id": conversation_id}
    )
    sender_read_event = await sender_socket.receive_json_from(timeout=1)
    recipient_read_event = await recipient_socket.receive_json_from(timeout=1)
    assert sender_read_event["type"] == "chat.conversation.read"
    assert recipient_read_event["user_id"] == sender_read_event["user_id"]

    await sender_socket.disconnect()
    await recipient_socket.disconnect()


@pytest.mark.django_db(transaction=True)
def test_anonymous_websocket_connection_is_rejected() -> None:
    async_to_sync(_assert_anonymous_connection_is_rejected)()


async def _assert_anonymous_connection_is_rejected() -> None:
    communicator = WebsocketCommunicator(
        application,
        "/ws/chat/",
        headers=[(b"origin", b"http://localhost")],
    )
    connected, close_code = await communicator.connect()
    assert connected is False
    assert close_code == 4401
