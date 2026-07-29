from datetime import timedelta

import pytest
from django.test import Client
from django.urls import reverse
from django.utils import timezone

from apps.common.models import PublicationStatus
from apps.media.models import MediaAsset
from apps.profiles.models import Profile
from apps.projects.models import Project, ProjectMember, ProjectRole, ProjectStatus
from apps.taxonomy.models import Category, Language, WorkFormat
from apps.users.models import User, UserRole


@pytest.mark.django_db
def test_public_catalogue_hides_expired_projects(client: Client) -> None:
    owner = User.objects.create_user(email="project-owner@example.com", password="test-password")
    category = Category.objects.create(name="Digital", slug="digital-test")
    work_format = WorkFormat.objects.create(name="Remote", slug="remote-test")
    language = Language.objects.create(
        name="English",
        slug="english-test",
        code="en-test",
        native_name="English",
    )
    public_project = Project.objects.create(
        slug="public-project",
        title="Public project",
        short_description="A visible project",
        description="A visible project description",
        owner=owner,
        category=category,
        work_format=work_format,
        working_language=language,
        status=ProjectStatus.PUBLISHED,
        published_at=timezone.now(),
    )
    ProjectRole.objects.create(project=public_project, title="Designer")
    Project.objects.create(
        slug="expired-project",
        title="Expired project",
        short_description="An expired project",
        description="An expired project description",
        owner=owner,
        category=category,
        work_format=work_format,
        working_language=language,
        status=ProjectStatus.PUBLISHED,
        published_at=timezone.now(),
        application_deadline=timezone.localdate() - timedelta(days=1),
    )

    response = client.get(reverse("project-list"))

    assert response.status_code == 200
    assert response.json()["count"] == 1
    assert [item["slug"] for item in response.json()["results"]] == ["public-project"]

    search_response = client.get(
        reverse("project-list"),
        {"search": "Digital Designer"},
    )
    assert [item["slug"] for item in search_response.json()["results"]] == [
        "public-project"
    ]


@pytest.mark.django_db
def test_talent_can_create_personal_draft_and_remain_a_talent(client: Client) -> None:
    owner = User.objects.create_user(email="draft-owner@example.com", password="test-password")
    avatar = MediaAsset.objects.create(
        uploaded_by=owner,
        storage_key="avatars/draft-owner.png",
        original_name="draft-owner.png",
        content_type="image/png",
        size_bytes=128,
        checksum="draft-owner-avatar",
        status=MediaAsset.Status.AVAILABLE,
        alt_text="Draft owner portrait",
    )
    owner_profile = Profile.objects.create(
        user=owner,
        slug="draft-owner",
        display_name="Draft owner",
        avatar=avatar,
        visibility=Profile.Visibility.PUBLIC,
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
    )
    UserRole.objects.create(user=owner, role=UserRole.Role.TALENT)
    category = Category.objects.create(name="Climate", slug="climate-test")
    work_format = WorkFormat.objects.create(name="On-site", slug="onsite-test")
    language = Language.objects.create(
        name="Russian",
        slug="russian-draft-test",
        code="ru-draft-test",
        native_name="Русский",
    )
    client.force_login(owner)
    created = client.post(
        reverse("my-projects"),
        {
            "slug": "owner-draft",
            "title": "Owner draft",
            "short_description": "A draft project",
            "description": "A draft project created by its owner.",
            "category": str(category.id),
            "work_format": str(work_format.id),
            "working_language": str(language.id),
        },
        content_type="application/json",
    )
    role = client.post(
        reverse("my-project-roles", kwargs={"project_id": created.json()["id"]}),
        {"title": "Coordinator", "seats_total": 2},
        content_type="application/json",
    )

    assert created.status_code == 201
    assert created.json()["slug"] == "owner-draft"
    assert created.json()["organization"] is None
    assert created.json()["owner_profile"]["slug"] == owner_profile.slug
    assert created.json()["owner_profile"]["avatar"] == {
        "id": str(avatar.id),
        "alt_text": "Draft owner portrait",
        "url": "/media/avatars/draft-owner.png",
    }
    assert role.status_code == 201
    assert role.json()["seats_total"] == 2
    assert set(owner.roles.values_list("role", flat=True)) == {
        UserRole.Role.TALENT,
        UserRole.Role.PROJECT_LEAD,
    }
    assert ProjectMember.objects.filter(
        project_id=created.json()["id"],
        profile=owner_profile,
        membership_role=ProjectMember.MembershipRole.OWNER,
        status=ProjectMember.Status.ACTIVE,
    ).exists()
