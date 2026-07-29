import pytest
from django.test import Client
from django.urls import reverse
from django.utils import timezone

from apps.audit.models import AuditEvent
from apps.common.models import PublicationStatus
from apps.profiles.models import Profile, ProfileSkill
from apps.taxonomy.models import Country, Skill
from apps.users.models import User, UserRole


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
    assert response.json()["count"] == 1
    assert [item["slug"] for item in response.json()["results"]] == ["public-user"]


@pytest.mark.django_db
def test_public_catalogue_excludes_authenticated_users_own_profile(client: Client) -> None:
    current_user = User.objects.create_user(
        email="current@example.com", password="test-password"
    )
    other_user = User.objects.create_user(
        email="other@example.com", password="test-password"
    )
    for user, slug in ((current_user, "current-user"), (other_user, "other-user")):
        Profile.objects.create(
            user=user,
            slug=slug,
            display_name=slug.replace("-", " ").title(),
            visibility=Profile.Visibility.PUBLIC,
            status=PublicationStatus.PUBLISHED,
            published_at=timezone.now(),
        )
    client.force_login(current_user)

    response = client.get(reverse("profile-list"))

    assert response.status_code == 200
    assert response.json()["count"] == 1
    assert [item["slug"] for item in response.json()["results"]] == ["other-user"]


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
    assert UserRole.objects.filter(user=user, role=UserRole.Role.TALENT).exists()


@pytest.mark.django_db
def test_only_approved_profile_owner_can_control_catalogue_visibility(
    client: Client,
) -> None:
    user = User.objects.create_user(email="visibility@example.com", password="test-password")
    profile = Profile.objects.create(
        user=user,
        slug="visibility-owner",
        display_name="Visibility owner",
    )
    client.force_login(user)
    catalogue_client = Client()

    before_approval = client.patch(
        reverse("my-profile-visibility"),
        {"is_visible": True},
        content_type="application/json",
    )
    profile.status = PublicationStatus.PUBLISHED
    profile.save(update_fields=["status", "updated_at"])
    publish = client.patch(
        reverse("my-profile-visibility"),
        {"is_visible": True},
        content_type="application/json",
    )
    visible_catalogue = catalogue_client.get(reverse("profile-list"))
    hide = client.patch(
        reverse("my-profile-visibility"),
        {"is_visible": False},
        content_type="application/json",
    )
    hidden_catalogue = catalogue_client.get(reverse("profile-list"))

    assert before_approval.status_code == 400
    assert publish.status_code == 200
    assert publish.json()["visibility"] == Profile.Visibility.PUBLIC
    assert publish.json()["published_at"] is not None
    assert [item["slug"] for item in visible_catalogue.json()["results"]] == [
        "visibility-owner"
    ]
    assert hide.status_code == 200
    assert hide.json()["visibility"] == Profile.Visibility.PRIVATE
    assert hidden_catalogue.json()["results"] == []
    assert AuditEvent.objects.filter(
        actor=user,
        action="profile.visibility_changed",
    ).count() == 2


@pytest.mark.django_db
def test_regular_profile_edit_cannot_bypass_visibility_control(client: Client) -> None:
    user = User.objects.create_user(email="private@example.com", password="test-password")
    profile = Profile.objects.create(
        user=user,
        slug="private-owner",
        display_name="Private owner",
        status=PublicationStatus.PUBLISHED,
    )
    client.force_login(user)

    response = client.patch(
        reverse("my-profile"),
        {"visibility": Profile.Visibility.PUBLIC},
        content_type="application/json",
    )
    profile.refresh_from_db()

    assert response.status_code == 400
    assert profile.visibility == Profile.Visibility.PRIVATE


@pytest.mark.django_db
def test_public_catalogue_searches_cyrillic_and_transliteration(client: Client) -> None:
    user = User.objects.create_user(email="designer@example.com", password="test-password")
    Profile.objects.create(
        user=user,
        slug="ux-designer",
        display_name="Дизайнер продуктов",
        headline="UX designer",
        visibility=Profile.Visibility.PUBLIC,
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
    )

    response = client.get(reverse("profile-list"), {"search": "dizayner"})

    assert response.status_code == 200
    assert [item["slug"] for item in response.json()["results"]] == ["ux-designer"]


@pytest.mark.django_db
def test_public_catalogue_searches_across_related_fields(client: Client) -> None:
    country = Country.objects.create(name="Kazakhstan", slug="kazakhstan-search", code="KZ")
    skill = Skill.objects.create(name="Python", slug="python-search")
    user = User.objects.create_user(email="python-kz@example.com", password="test-password")
    profile = Profile.objects.create(
        user=user,
        slug="python-specialist",
        display_name="Amina Yusuf",
        country=country,
        visibility=Profile.Visibility.PUBLIC,
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
    )
    ProfileSkill.objects.create(profile=profile, skill=skill)

    response = client.get(reverse("profile-list"), {"search": "Python Kazakhstan"})

    assert response.status_code == 200
    assert [item["slug"] for item in response.json()["results"]] == [
        "python-specialist"
    ]
