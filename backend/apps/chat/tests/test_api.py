import pytest
from django.test import Client
from django.urls import reverse
from django.utils import timezone

from apps.chat.models import ChatMessage, Conversation
from apps.common.models import PublicationStatus
from apps.media.models import MediaAsset
from apps.notifications.models import Notification
from apps.organizations.models import Organization, OrganizationMembership
from apps.profiles.models import Profile
from apps.users.models import User


def create_public_profile(email: str, slug: str) -> tuple[User, Profile]:
    user = User.objects.create_user(email=email, password="test-password")
    profile = Profile.objects.create(
        user=user,
        slug=slug,
        display_name=slug.title(),
        visibility=Profile.Visibility.PUBLIC,
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
    )
    return user, profile


def add_profile_avatar(user: User, profile: Profile, storage_key: str) -> MediaAsset:
    asset = MediaAsset.objects.create(
        uploaded_by=user,
        storage_key=storage_key,
        original_name="avatar.png",
        content_type="image/png",
        size_bytes=128,
        checksum=f"checksum-{storage_key}",
        status=MediaAsset.Status.AVAILABLE,
    )
    profile.avatar = asset
    profile.save(update_fields=["avatar"])
    return asset


def create_public_organization(owner: User, slug: str = "demo-organization") -> Organization:
    organization = Organization.objects.create(
        slug=slug,
        legal_name="Demo Organization",
        display_name="Demo Organization",
        organization_type=Organization.OrganizationType.COMMUNITY,
        visibility=Organization.Visibility.PUBLIC,
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
    )
    OrganizationMembership.objects.create(
        organization=organization,
        user=owner,
        role=OrganizationMembership.Role.OWNER,
        status=OrganizationMembership.Status.ACTIVE,
        joined_at=timezone.now(),
    )
    return organization


@pytest.mark.django_db
def test_participants_can_create_read_and_send_messages(client: Client) -> None:
    sender, sender_profile = create_public_profile("sender@example.com", "sender")
    recipient, recipient_profile = create_public_profile("recipient@example.com", "recipient")
    add_profile_avatar(sender, sender_profile, "avatars/sender.png")
    outsider, _ = create_public_profile("outsider@example.com", "outsider")
    client.force_login(sender)

    created = client.post(
        reverse("conversation-list"),
        {"participant_profile_ids": [str(recipient_profile.id)], "message": "Hello there"},
        content_type="application/json",
    )
    conversation_id = created.json()["id"]
    sent = client.post(
        reverse("conversation-messages", kwargs={"conversation_id": conversation_id}),
        {"body": "How are you?"},
        content_type="application/json",
    )

    client.force_login(recipient)
    conversations = client.get(reverse("conversation-list"))
    messages = client.get(
        reverse("conversation-messages", kwargs={"conversation_id": conversation_id}),
    )
    marked_read = client.post(
        reverse("conversation-read", kwargs={"conversation_id": conversation_id})
    )
    after_read = client.get(reverse("conversation-list"))

    client.force_login(outsider)
    denied = client.get(
        reverse("conversation-messages", kwargs={"conversation_id": conversation_id})
    )

    assert created.status_code == 201
    assert created.json()["kind"] == Conversation.Kind.DIRECT
    sender_participant = next(
        item
        for item in created.json()["participants"]
        if item["entity_id"] == str(sender_profile.id)
    )
    assert sender_participant["avatar_url"].endswith("/avatars/sender.png")
    assert created.json()["last_message"]["sender_avatar_url"].endswith(
        "/avatars/sender.png"
    )
    assert sent.status_code == 201
    assert messages.status_code == 200
    assert len(messages.json()) == 2
    assert conversations.json()[0]["unread_count"] == 2
    assert marked_read.status_code == 204
    assert after_read.json()[0]["unread_count"] == 0
    assert denied.status_code == 404
    assert ChatMessage.objects.filter(conversation_id=conversation_id).count() == 2
    assert Conversation.objects.filter(pk=conversation_id).exists()
    assert Notification.objects.filter(recipient=recipient, type="chat.message").count() == 2
    assert not Notification.objects.filter(
        recipient=recipient,
        type="chat.message",
        read_at__isnull=True,
    ).exists()
    assert sender_profile.user_id == sender.id


@pytest.mark.django_db
def test_chat_requires_a_public_recipient_profile(client: Client) -> None:
    sender, _ = create_public_profile("sender@example.com", "sender")
    private_user = User.objects.create_user(email="private@example.com", password="test-password")
    private_profile = Profile.objects.create(
        user=private_user,
        slug="private",
        display_name="Private",
        visibility=Profile.Visibility.PRIVATE,
    )
    client.force_login(sender)

    response = client.post(
        reverse("conversation-list"),
        {"participant_profile_ids": [str(private_profile.id)], "message": "Hello"},
        content_type="application/json",
    )

    assert response.status_code == 400


@pytest.mark.django_db
def test_organization_members_can_access_and_reply_as_organization(client: Client) -> None:
    talent, _ = create_public_profile("talent@example.com", "talent")
    owner, _ = create_public_profile("owner@example.com", "owner")
    outsider, _ = create_public_profile("outsider-org@example.com", "outsider-org")
    organization = create_public_organization(owner)
    client.force_login(talent)

    created = client.post(
        reverse("conversation-list"),
        {"organization_ids": [str(organization.id)], "message": "Hello organization"},
        content_type="application/json",
    )
    conversation_id = created.json()["id"]

    client.force_login(owner)
    conversations = client.get(reverse("conversation-list"))
    reply = client.post(
        reverse("conversation-messages", kwargs={"conversation_id": conversation_id}),
        {
            "body": "Hello from the team",
            "sender_organization_id": str(organization.id),
        },
        content_type="application/json",
    )
    marked_read = client.post(
        reverse("conversation-read", kwargs={"conversation_id": conversation_id})
    )
    after_read = client.get(reverse("conversation-list"))

    client.force_login(outsider)
    denied = client.get(
        reverse("conversation-messages", kwargs={"conversation_id": conversation_id})
    )

    assert created.status_code == 201
    assert created.json()["kind"] == Conversation.Kind.ORGANIZATION
    assert {item["kind"] for item in created.json()["participants"]} == {
        "talent",
        "organization",
    }
    assert conversations.status_code == 200
    assert conversations.json()[0]["unread_count"] == 1
    assert reply.status_code == 201
    assert reply.json()["sender_kind"] == "organization"
    assert reply.json()["sender_name"] == organization.display_name
    assert reply.json()["sender_organization"] == str(organization.id)
    assert marked_read.status_code == 204
    assert after_read.json()[0]["unread_count"] == 0
    assert {item["kind"] for item in after_read.json()[0]["participants"]} == {
        "talent",
        "organization",
    }
    assert denied.status_code == 404


@pytest.mark.django_db
def test_conversation_with_talents_and_organization_is_a_group(client: Client) -> None:
    creator, _ = create_public_profile("creator@example.com", "creator")
    recipient, recipient_profile = create_public_profile(
        "group-member@example.com", "group-member"
    )
    owner, _ = create_public_profile("group-owner@example.com", "group-owner")
    organization = create_public_organization(owner, slug="group-organization")
    client.force_login(creator)

    response = client.post(
        reverse("conversation-list"),
        {
            "participant_profile_ids": [str(recipient_profile.id)],
            "organization_ids": [str(organization.id)],
            "subject": "Joint working group",
            "message": "Welcome everyone",
        },
        content_type="application/json",
    )

    assert response.status_code == 201
    assert response.json()["kind"] == Conversation.Kind.GROUP
    assert response.json()["subject"] == "Joint working group"
    assert len(response.json()["participants"]) == 3
    assert recipient.email == "group-member@example.com"
