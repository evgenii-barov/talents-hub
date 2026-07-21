from typing import Any

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import F, Q
from django.utils import timezone

from apps.common.models import SoftDeleteModel
from apps.profiles.models import Profile
from apps.projects.models import ProjectMember, ProjectRole, ProjectStatus


class InvalidApplicationTransition(ValidationError):
    pass


class ProjectApplication(SoftDeleteModel):
    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        IN_REVIEW = "in_review", "In review"
        SHORTLISTED = "shortlisted", "Shortlisted"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        WITHDRAWN = "withdrawn", "Withdrawn"
        CANCELLED = "cancelled", "Cancelled"

    ACTIVE_STATUSES = (Status.SUBMITTED, Status.IN_REVIEW, Status.SHORTLISTED, Status.ACCEPTED)
    TRANSITIONS = {
        Status.SUBMITTED: {Status.IN_REVIEW, Status.WITHDRAWN, Status.CANCELLED},
        Status.IN_REVIEW: {
            Status.SHORTLISTED,
            Status.ACCEPTED,
            Status.REJECTED,
            Status.WITHDRAWN,
            Status.CANCELLED,
        },
        Status.SHORTLISTED: {
            Status.ACCEPTED,
            Status.REJECTED,
            Status.WITHDRAWN,
            Status.CANCELLED,
        },
        Status.ACCEPTED: {Status.CANCELLED},
    }

    project_role = models.ForeignKey(
        ProjectRole,
        on_delete=models.PROTECT,
        related_name="applications",
    )
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="project_applications",
    )
    cover_letter = models.TextField(blank=True)
    status = models.CharField(choices=Status.choices, default=Status.SUBMITTED, max_length=16)
    submitted_at = models.DateTimeField(default=timezone.now)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_project_applications",
    )
    review_note = models.TextField(blank=True)
    withdrawn_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project_role", "applicant"],
                condition=Q(
                    deleted_at__isnull=True,
                    status__in=("submitted", "in_review", "shortlisted", "accepted"),
                ),
                name="applications_unique_active_role_application",
            ),
        ]
        indexes = [models.Index(fields=["project_role", "status"])]

    @classmethod
    def submit(
        cls,
        *,
        project_role: ProjectRole,
        applicant: Any,
        cover_letter: str = "",
    ) -> "ProjectApplication":
        project = project_role.project
        if project.owner_id == applicant.id:
            raise ValidationError("A project owner cannot apply to their own role.")
        if project.status != ProjectStatus.PUBLISHED:
            raise ValidationError("Applications are unavailable until the project is published.")
        if project_role.status != ProjectRole.Status.OPEN:
            raise ValidationError("This role is not open for applications.")
        if project.application_deadline and project.application_deadline < timezone.localdate():
            raise ValidationError("The application deadline has passed.")
        if not Profile.objects.public().filter(user=applicant).exists():
            raise ValidationError("A published public profile is required to apply.")
        return cls.objects.create(
            project_role=project_role,
            applicant=applicant,
            cover_letter=cover_letter,
        )

    @transaction.atomic
    def transition(
        self,
        target_status: str,
        *,
        reviewer: Any | None = None,
        review_note: str = "",
    ) -> "ProjectApplication":
        application = type(self).objects.select_for_update().select_related(
            "project_role__project", "applicant"
        ).get(pk=self.pk)
        try:
            target = self.Status(target_status)
        except ValueError as exc:
            raise InvalidApplicationTransition("Unknown application status.") from exc
        current_status = self.Status(application.status)
        allowed: set[ProjectApplication.Status] = self.TRANSITIONS.get(current_status, set())
        if target not in allowed:
            raise InvalidApplicationTransition(
                f"Cannot move an application from {application.status} to {target}."
            )

        if target == self.Status.ACCEPTED:
            application._accept(reviewer)

        if target in {self.Status.IN_REVIEW, self.Status.SHORTLISTED, self.Status.REJECTED}:
            application.reviewed_at = timezone.now()
            application.reviewed_by = reviewer
            application.review_note = review_note
        if target == self.Status.WITHDRAWN:
            application.withdrawn_at = timezone.now()
        application.status = target
        application.save(
            update_fields=[
                "status",
                "reviewed_at",
                "reviewed_by",
                "review_note",
                "withdrawn_at",
                "updated_at",
            ]
        )
        return application

    def _accept(self, reviewer: Any | None) -> None:
        role = (
            ProjectRole.objects.select_for_update()
            .select_related("project")
            .get(pk=self.project_role_id)
        )
        if role.status != ProjectRole.Status.OPEN or role.seats_filled >= role.seats_total:
            raise InvalidApplicationTransition("This role no longer has an open seat.")
        try:
            profile = Profile.objects.get(user_id=self.applicant_id, deleted_at__isnull=True)
        except Profile.DoesNotExist as exc:
            raise InvalidApplicationTransition("The applicant profile no longer exists.") from exc
        member, created = ProjectMember.objects.get_or_create(
            project=role.project,
            profile=profile,
            defaults={
                "project_role": role,
                "membership_role": ProjectMember.MembershipRole.CONTRIBUTOR,
                "status": ProjectMember.Status.ACTIVE,
            },
        )
        if not created and member.status == ProjectMember.Status.ACTIVE:
            raise InvalidApplicationTransition("The applicant is already a project member.")
        if not created:
            member.project_role = role
            member.membership_role = ProjectMember.MembershipRole.CONTRIBUTOR
            member.status = ProjectMember.Status.ACTIVE
            member.left_at = None
            member.save(
                update_fields=["project_role", "membership_role", "status", "left_at", "updated_at"]
            )
        role.seats_filled = F("seats_filled") + 1
        role.save(update_fields=["seats_filled", "updated_at"])
        role.refresh_from_db(fields=["seats_filled"])
        if role.seats_filled == role.seats_total:
            role.status = ProjectRole.Status.FILLED
            role.save(update_fields=["status", "updated_at"])
