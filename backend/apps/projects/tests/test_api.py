from datetime import timedelta

import pytest
from django.test import Client
from django.urls import reverse
from django.utils import timezone

from apps.projects.models import Project, ProjectRole, ProjectStatus
from apps.taxonomy.models import Category, Language, WorkFormat
from apps.users.models import User


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
    assert [item["slug"] for item in response.json()] == ["public-project"]


@pytest.mark.django_db
def test_owner_can_create_draft_and_its_role(client: Client) -> None:
    owner = User.objects.create_user(email="draft-owner@example.com", password="test-password")
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
    assert role.status_code == 201
    assert role.json()["seats_total"] == 2
