import pytest
from django.test import Client
from django.urls import reverse
from django.utils import timezone

from apps.applications.models import ProjectApplication
from apps.common.models import PublicationStatus
from apps.notifications.models import Notification
from apps.profiles.models import Profile
from apps.projects.models import Project, ProjectMember, ProjectRole, ProjectStatus
from apps.taxonomy.models import Category, Language, WorkFormat
from apps.users.models import User


@pytest.fixture
def role_with_eligible_applicant() -> tuple[ProjectRole, User, User]:
    owner = User.objects.create_user(email="lead@example.com", password="test-password")
    applicant = User.objects.create_user(email="applicant@example.com", password="test-password")
    Profile.objects.create(
        user=applicant,
        slug="eligible-applicant",
        display_name="Eligible applicant",
        visibility=Profile.Visibility.PUBLIC,
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
    )
    category = Category.objects.create(name="Education", slug="education-test")
    work_format = WorkFormat.objects.create(name="Hybrid", slug="hybrid-test")
    language = Language.objects.create(
        name="Russian",
        slug="russian-test",
        code="ru-test",
        native_name="Русский",
    )
    project = Project.objects.create(
        slug="application-project",
        title="Application project",
        short_description="A project for application tests",
        description="A project used to verify the application state machine.",
        owner=owner,
        category=category,
        work_format=work_format,
        working_language=language,
        status=ProjectStatus.PUBLISHED,
        published_at=timezone.now(),
    )
    return ProjectRole.objects.create(project=project, title="Researcher"), owner, applicant


@pytest.mark.django_db
def test_application_acceptance_creates_member_and_fills_seat(
    role_with_eligible_applicant: tuple[ProjectRole, User, User],
) -> None:
    role, owner, applicant = role_with_eligible_applicant
    application = ProjectApplication.submit(project_role=role, applicant=applicant)

    application.transition(ProjectApplication.Status.IN_REVIEW, reviewer=owner)
    accepted = application.transition(ProjectApplication.Status.ACCEPTED, reviewer=owner)
    role.refresh_from_db()

    assert accepted.status == ProjectApplication.Status.ACCEPTED
    assert role.seats_filled == 1
    assert role.status == ProjectRole.Status.FILLED
    assert ProjectMember.objects.filter(project=role.project, profile__user=applicant).exists()


@pytest.mark.django_db
def test_authenticated_applicant_can_submit_and_owner_can_review(
    client: Client,
    role_with_eligible_applicant: tuple[ProjectRole, User, User],
) -> None:
    role, owner, applicant = role_with_eligible_applicant
    client.force_login(applicant)
    submission = client.post(
        reverse("role-apply", kwargs={"role_id": role.id}),
        {"cover_letter": "I can help with research."},
        content_type="application/json",
    )
    client.force_login(owner)
    review = client.patch(
        reverse("application-transition", kwargs={"application_id": submission.json()["id"]}),
        {"status": ProjectApplication.Status.IN_REVIEW},
        content_type="application/json",
    )
    owner_list = client.get(
        reverse("my-project-applications", kwargs={"project_id": role.project_id})
    )
    client.force_login(applicant)
    applicant_list = client.get(reverse("my-applications"))

    assert submission.status_code == 201
    assert review.status_code == 200
    assert review.json()["status"] == ProjectApplication.Status.IN_REVIEW
    assert owner_list.json()[0]["applicant_name"] == "Eligible applicant"
    assert applicant_list.json()[0]["project_title"] == "Application project"
    submission_notification = Notification.objects.get(
        recipient=owner,
        type="application_submitted",
    )
    assert submission_notification.payload["applicant_name"] == "Eligible applicant"
    assert submission_notification.payload["project_slug"] == role.project.slug
    status_notification = Notification.objects.get(
        recipient=applicant,
        type="application_status_changed",
    )
    assert status_notification.payload["status"] == ProjectApplication.Status.IN_REVIEW


@pytest.mark.django_db
def test_duplicate_active_application_returns_clear_conflict(
    client: Client,
    role_with_eligible_applicant: tuple[ProjectRole, User, User],
) -> None:
    role, _, applicant = role_with_eligible_applicant
    client.force_login(applicant)

    first = client.post(
        reverse("role-apply", kwargs={"role_id": role.id}),
        {"cover_letter": "I can help."},
        content_type="application/json",
    )
    duplicate = client.post(
        reverse("role-apply", kwargs={"role_id": role.id}),
        {"cover_letter": "I can still help."},
        content_type="application/json",
    )

    assert first.status_code == 201
    assert duplicate.status_code == 409
    assert duplicate.json() == {
        "code": "duplicate_application",
        "detail": "You have already applied for this role.",
    }
