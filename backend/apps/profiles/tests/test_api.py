import pytest
from django.test import Client
from django.urls import reverse
from django.utils import timezone

from apps.common.models import PublicationStatus
from apps.profiles.models import Profile
from apps.users.models import User


@pytest.mark.django_db
def test_public_catalogue_shows_only_published_public_profiles(client: Client) -> None:
    public_user = User.objects.create_user(email="public@example.com", password="test-password")
    private_user = User.objects.create_user(email="private@example.com", password="test-password")
    draft_user = User.objects.create_user(email="draft@example.com", password="test-password")
    Profile.objects.create(
        user=public_user,
        slug="public-user",
        display_name="Public user",
        visibility=Profile.Visibility.PUBLIC,
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
    )
    Profile.objects.create(
        user=private_user,
        slug="private-user",
        display_name="Private user",
        visibility=Profile.Visibility.PRIVATE,
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
    )
    Profile.objects.create(
        user=draft_user,
        slug="draft-user",
        display_name="Draft user",
        visibility=Profile.Visibility.PUBLIC,
        status=PublicationStatus.DRAFT,
    )

    response = client.get(reverse("profile-list"))

    assert response.status_code == 200
    assert [item["slug"] for item in response.json()] == ["public-user"]


@pytest.mark.django_db
def test_authenticated_user_can_create_and_read_only_own_profile(client: Client) -> None:
    user = User.objects.create_user(email="owner@example.com", password="test-password")
    client.force_login(user)

    create_response = client.post(
        reverse("my-profile"),
        {"slug": "owner", "display_name": "Profile owner", "visibility": "private"},
        content_type="application/json",
    )
    read_response = client.get(reverse("my-profile"))

    assert create_response.status_code == 201
    assert read_response.status_code == 200
    assert read_response.json()["slug"] == "owner"
