from typing import Any

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from apps.audit.models import AuditEvent
from apps.media.models import MediaAsset
from apps.notifications.outbox import OutboxEvent
from apps.organizations.models import Organization, OrganizationMembership
from apps.profiles.models import Profile
from apps.projects.models import Project

from .models import ModerationCase

TARGET_MODELS: dict[str, Any] = {
    "profile": Profile,
    "organization": Organization,
    "project": Project,
    "media": MediaAsset,
}


def resolve_target(*, target_type: str, target_id: str) -> Any:
    model = TARGET_MODELS.get(target_type)
    if model is None:
        raise ValidationError("Unsupported moderation target.")
    try:
        return model.objects.get(pk=target_id)
    except model.DoesNotExist as exc:
        raise ValidationError("Moderation target does not exist.") from exc


def can_submit_for_moderation(*, target: Any, user: Any) -> bool:
    if isinstance(target, Profile):
        return bool(target.user_id == user.id)
    if isinstance(target, Project):
        return bool(target.owner_id == user.id)
    if isinstance(target, Organization):
        return bool(target.memberships.filter(
            user=user,
            status=OrganizationMembership.Status.ACTIVE,
            deleted_at__isnull=True,
            role__in=(
                OrganizationMembership.Role.OWNER,
                OrganizationMembership.Role.ADMIN,
                OrganizationMembership.Role.EDITOR,
            ),
        ).exists())
    if isinstance(target, MediaAsset):
        return bool(target.uploaded_by_id == user.id)
    return False


@transaction.atomic
def submit_for_moderation(*, target: Any, reporter: Any, reason_code: str) -> ModerationCase:
    if not can_submit_for_moderation(target=target, user=reporter):
        raise PermissionDenied("You cannot submit this object for moderation.")
    content_type = ContentType.objects.get_for_model(target, for_concrete_model=False)
    if ModerationCase.objects.filter(
        content_type=content_type,
        object_id=target.id,
        status__in=(ModerationCase.Status.OPEN, ModerationCase.Status.IN_REVIEW),
    ).exists():
        raise ValidationError("This object already has an active moderation case.")
    before = {"status": target.status}
    if hasattr(target, "moderated_at"):
        target.status = "pending_moderation"
        target.moderation_note = ""
        target.save(update_fields=["status", "moderation_note", "updated_at"])
    case = ModerationCase.objects.create(
        content_type=content_type,
        object_id=target.id,
        reporter=reporter,
        reason_code=reason_code,
    )
    AuditEvent.objects.create(
        actor=reporter,
        content_type=content_type,
        object_id=target.id,
        action="moderation.submitted",
        before=before,
        after={"status": target.status, "case_id": str(case.id)},
    )
    return case


def _target_recipient(target: Any) -> Any | None:
    if isinstance(target, Profile):
        return target.user
    if isinstance(target, Project):
        return target.owner
    if isinstance(target, MediaAsset):
        return target.uploaded_by
    if isinstance(target, Organization):
        membership = target.memberships.filter(
            status=OrganizationMembership.Status.ACTIVE,
            deleted_at__isnull=True,
            role=OrganizationMembership.Role.OWNER,
        ).select_related("user").first()
        return membership.user if membership else None
    return None


@transaction.atomic
def decide_case(
    *,
    case: ModerationCase,
    moderator: Any,
    decision: str,
    note: str,
) -> ModerationCase:
    case = ModerationCase.objects.select_for_update().get(pk=case.pk)
    if case.status not in {ModerationCase.Status.OPEN, ModerationCase.Status.IN_REVIEW}:
        raise ValidationError("This moderation case is already resolved.")
    target_model: Any = case.content_type.model_class()
    if target_model is None:
        raise ValidationError("The moderation target is no longer supported.")
    try:
        target = target_model.objects.select_for_update().get(pk=case.object_id)
    except target_model.DoesNotExist as exc:
        raise ValidationError("The moderation target no longer exists.") from exc
    allowed = {
        "approved": ModerationCase.Status.APPROVED,
        "changes_requested": ModerationCase.Status.CHANGES_REQUESTED,
        "rejected": ModerationCase.Status.REJECTED,
    }
    if decision not in allowed:
        raise ValidationError("Unsupported moderation decision.")
    if isinstance(target, MediaAsset) and decision == "changes_requested":
        raise ValidationError("Media assets can only be approved or rejected.")

    before = {"status": target.status}
    if isinstance(target, MediaAsset):
        target.status = (
            MediaAsset.Status.AVAILABLE
            if decision == "approved"
            else MediaAsset.Status.REJECTED
        )
        target.save(update_fields=["status", "updated_at"])
    else:
        target.status = "published" if decision == "approved" else decision
        target.moderated_at = timezone.now()
        target.moderated_by = moderator
        target.moderation_note = note
        update_fields = ["status", "moderated_at", "moderated_by", "moderation_note", "updated_at"]
        if decision == "approved" and isinstance(target, Profile):
            # Approval makes a profile eligible for publication. The owner must
            # explicitly opt in before the profile appears in the catalogue.
            target.visibility = Profile.Visibility.PRIVATE
            target.published_at = None
            update_fields.extend(["visibility", "published_at"])
        elif decision == "approved" and target.published_at is None:
            target.published_at = timezone.now()
            update_fields.append("published_at")
        target.save(update_fields=update_fields)

    case.status = allowed[decision]
    case.assigned_to = moderator
    case.decision_note = note
    case.resolved_at = timezone.now()
    case.save(update_fields=["status", "assigned_to", "decision_note", "resolved_at", "updated_at"])
    AuditEvent.objects.create(
        actor=moderator,
        content_type=case.content_type,
        object_id=case.object_id,
        action=f"moderation.{decision}",
        before=before,
        after={"status": target.status, "case_id": str(case.id), "note": note},
    )
    recipient = _target_recipient(target)
    if recipient is not None:
        OutboxEvent.enqueue(
            topic="notifications.moderation_decided",
            payload={
                "recipient_id": recipient.id,
                "case_id": str(case.id),
                "target_type": case.content_type.model,
                "target_id": str(case.object_id),
                "decision": decision,
                "note": note,
            },
        )
    return case
