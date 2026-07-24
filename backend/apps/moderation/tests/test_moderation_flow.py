import pytest
from django.test import Client
from django.urls import reverse

from apps.audit.models import AuditEvent
from apps.moderation.models import ModerationCase
from apps.moderation.services import decide_case, submit_for_moderation
from apps.notifications.models import Notification
from apps.notifications.outbox import OutboxEvent
from apps.notifications.tasks import process_outbox_event
from apps.profiles.models import Profile
from apps.users.models import User


@pytest.fixture
def submitted_profile() -> tuple[Profile, User, User]:
    owner = User.objects.create_user(email="owner@example.com", password="test-password")
    moderator = User.objects.create_user(
        email="moderator@example.com",
        password="test-password",
        is_staff=True,
    )
    profile = Profile.objects.create(user=owner, slug="owner", display_name="Profile owner")
    return profile, owner, moderator


@pytest.mark.django_db
def test_approval_updates_target_audits_and_delivers_notification(
    submitted_profile: tuple[Profile, User, User],
) -> None:
    profile, owner, moderator = submitted_profile
    case = submit_for_moderation(
        target=profile,
        reporter=owner,
        reason_code="publication_review",
    )
    profile.refresh_from_db()

    resolved = decide_case(case=case, moderator=moderator, decision="approved", note="Looks good.")
    profile.refresh_from_db()
    event = OutboxEvent.objects.get()
    process_outbox_event.run(str(event.id))
    event.refresh_from_db()

    assert resolved.status == ModerationCase.Status.APPROVED
    assert profile.status == "published"
    assert profile.moderated_by == moderator
    assert AuditEvent.objects.filter(action="moderation.submitted").exists()
    assert AuditEvent.objects.filter(action="moderation.approved").exists()
    assert event.processed_at is not None
    assert Notification.objects.filter(recipient=owner, type="moderation.decision").exists()


@pytest.mark.django_db
def test_owner_submits_and_moderator_decides_through_api(
    client: Client,
    submitted_profile: tuple[Profile, User, User],
) -> None:
    profile, owner, moderator = submitted_profile
    client.force_login(owner)
    submitted = client.post(
        reverse("moderation-submit"),
        {"target_type": "profile", "target_id": str(profile.id)},
        content_type="application/json",
    )
    client.force_login(moderator)
    resolved = client.patch(
        reverse("moderation-decision", kwargs={"case_id": submitted.json()["id"]}),
        {"decision": "changes_requested", "note": "Add your portfolio link."},
        content_type="application/json",
    )

    assert submitted.status_code == 201
    assert resolved.status_code == 200
    assert resolved.json()["status"] == ModerationCase.Status.CHANGES_REQUESTED
