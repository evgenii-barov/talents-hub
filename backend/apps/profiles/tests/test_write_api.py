from datetime import date

import pytest
from django.test import Client
from django.urls import reverse

from apps.profiles.models import Profile, ProfileLanguage, ProfileProjectPreference, ProfileSkill
from apps.taxonomy.models import Category, Language, Skill, WorkFormat
from apps.users.models import User


@pytest.fixture
def owner_profile(client: Client) -> tuple[Client, Profile]:
    user = User.objects.create_user(email="owner@example.com", password="test-password")
    profile = Profile.objects.create(user=user, slug="owner", display_name="Owner")
    client.force_login(user)
    return client, profile


@pytest.mark.django_db
def test_owner_can_manage_profile_skills_and_primary_skill(
    owner_profile: tuple[Client, Profile],
) -> None:
    client, profile = owner_profile
    first_skill = Skill.objects.create(name="Research", slug="research")
    second_skill = Skill.objects.create(name="Design", slug="design")

    first_response = client.post(
        reverse("my-profile-skills"),
        {"skill": str(first_skill.id), "level": "advanced", "is_primary": True},
        content_type="application/json",
    )
    second_response = client.post(
        reverse("my-profile-skills"),
        {"skill": str(second_skill.id), "is_primary": True},
        content_type="application/json",
    )
    duplicate_response = client.post(
        reverse("my-profile-skills"),
        {"skill": str(second_skill.id)},
        content_type="application/json",
    )
    delete_response = client.delete(
        reverse("my-profile-skill", kwargs={"item_id": first_response.json()["id"]}),
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert duplicate_response.status_code == 400
    assert delete_response.status_code == 204
    assert ProfileSkill.objects.get(profile=profile, skill=first_skill).deleted_at is not None
    assert ProfileSkill.objects.get(profile=profile, skill=second_skill).is_primary is True


@pytest.mark.django_db
def test_owner_can_manage_languages_and_experience(owner_profile: tuple[Client, Profile]) -> None:
    client, profile = owner_profile
    english = Language.objects.create(
        name="English",
        slug="english",
        code="en",
        native_name="English",
    )
    french = Language.objects.create(
        name="French",
        slug="french",
        code="fr",
        native_name="Français",
    )
    remote = WorkFormat.objects.create(name="Remote", slug="remote")

    first_language = client.post(
        reverse("my-profile-languages"),
        {"language": str(english.id), "proficiency": "c1", "is_primary": True},
        content_type="application/json",
    )
    second_language = client.post(
        reverse("my-profile-languages"),
        {"language": str(french.id), "proficiency": "b2", "is_primary": True},
        content_type="application/json",
    )
    experience = client.post(
        reverse("my-profile-experiences"),
        {
            "organization_name": "Talents Hub",
            "title": "Researcher",
            "work_format": str(remote.id),
            "started_on": date(2025, 1, 1).isoformat(),
            "is_current": True,
        },
        content_type="application/json",
    )
    invalid_experience = client.post(
        reverse("my-profile-experiences"),
        {
            "organization_name": "Talents Hub",
            "title": "Researcher",
            "started_on": date(2025, 1, 1).isoformat(),
            "ended_on": date(2024, 1, 1).isoformat(),
        },
        content_type="application/json",
    )

    assert first_language.status_code == 201
    assert second_language.status_code == 201
    assert ProfileLanguage.objects.get(profile=profile, language=english).is_primary is False
    assert experience.status_code == 201
    assert invalid_experience.status_code == 400


@pytest.mark.django_db
def test_owner_can_manage_project_preferences(owner_profile: tuple[Client, Profile]) -> None:
    client, profile = owner_profile
    category = Category.objects.get(slug="science-education")

    create_response = client.post(
        reverse("my-profile-project-preferences"),
        {
            "category": str(category.id),
            "note": "Хочу участвовать в прикладных исследованиях.",
        },
        content_type="application/json",
    )
    invalid_response = client.post(
        reverse("my-profile-project-preferences"),
        {"note": "Нет выбранного направления"},
        content_type="application/json",
    )
    preference_id = create_response.json()["id"]
    patch_response = client.patch(
        reverse("my-profile-project-preference", kwargs={"item_id": preference_id}),
        {"note": "Интересуют исследования и образовательные программы."},
        content_type="application/json",
    )
    delete_response = client.delete(
        reverse("my-profile-project-preference", kwargs={"item_id": preference_id})
    )

    assert create_response.status_code == 201
    assert create_response.json()["category"]["slug"] == "science-education"
    assert invalid_response.status_code == 400
    assert patch_response.status_code == 200
    assert delete_response.status_code == 204
    assert ProfileProjectPreference.objects.get(profile=profile).deleted_at is not None
