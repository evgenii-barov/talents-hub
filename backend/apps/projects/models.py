from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q
from django.utils import timezone

from apps.common.models import PublishableModel, SoftDeleteModel
from apps.organizations.models import Organization
from apps.profiles.models import Profile
from apps.taxonomy.models import Category, City, Country, FocusArea, Language, Skill, WorkFormat


class ProjectStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PENDING_MODERATION = "pending_moderation", "Pending moderation"
    PUBLISHED = "published", "Published"
    CHANGES_REQUESTED = "changes_requested", "Changes requested"
    ARCHIVED = "archived", "Archived"
    REJECTED = "rejected", "Rejected"
    COMPLETED = "completed", "Completed"


class ProjectQuerySet(models.QuerySet["Project"]):
    def public(self) -> "ProjectQuerySet":
        return self.filter(
            deleted_at__isnull=True,
            status=ProjectStatus.PUBLISHED,
        ).filter(
            Q(application_deadline__isnull=True)
            | Q(application_deadline__gte=timezone.localdate())
        )


class Project(PublishableModel):
    class Stage(models.TextChoices):
        IDEA = "idea", "Idea"
        TEAM_FORMATION = "team_formation", "Team formation"
        PROTOTYPE = "prototype", "Prototype"
        PILOT = "pilot", "Pilot"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"

    class Scope(models.TextChoices):
        LOCAL = "local", "Local"
        NATIONAL = "national", "National"
        INTERNATIONAL = "international", "International"

    status = models.CharField(
        choices=ProjectStatus.choices,
        default=ProjectStatus.DRAFT,
        max_length=32,
    )
    slug = models.SlugField(max_length=160)
    title = models.CharField(max_length=255)
    short_description = models.CharField(max_length=500)
    description = models.TextField()
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="projects",
    )
    organization = models.ForeignKey(
        Organization,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="projects",
    )
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="projects")
    stage = models.CharField(choices=Stage.choices, default=Stage.IDEA, max_length=32)
    problem_statement = models.TextField(blank=True)
    goal_statement = models.TextField(blank=True)
    expected_outcome = models.TextField(blank=True)
    timeline_text = models.CharField(max_length=500, blank=True)
    scope = models.CharField(choices=Scope.choices, default=Scope.LOCAL, max_length=16)
    country = models.ForeignKey(
        Country,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="projects",
    )
    city = models.ForeignKey(
        City,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="projects",
    )
    work_format = models.ForeignKey(WorkFormat, on_delete=models.PROTECT, related_name="projects")
    working_language = models.ForeignKey(
        Language,
        on_delete=models.PROTECT,
        related_name="projects",
    )
    starts_on = models.DateField(blank=True, null=True)
    ends_on = models.DateField(blank=True, null=True)
    application_deadline = models.DateField(blank=True, null=True)
    is_featured = models.BooleanField(default=False)

    objects = ProjectQuerySet.as_manager()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["slug"],
                condition=Q(deleted_at__isnull=True),
                name="projects_unique_active_slug",
            ),
            models.CheckConstraint(
                condition=(
                    Q(ends_on__isnull=True)
                    | Q(starts_on__isnull=True)
                    | Q(ends_on__gte=F("starts_on"))
                ),
                name="projects_end_not_before_start",
            ),
            models.CheckConstraint(
                condition=(
                    Q(application_deadline__isnull=True)
                    | Q(starts_on__isnull=True)
                    | Q(application_deadline__lte=F("starts_on"))
                ),
                name="projects_deadline_not_after_start",
            ),
        ]
        indexes = [
            models.Index(fields=["status", "published_at"], name="projects_status_published_idx"),
            models.Index(fields=["category", "stage"], name="projects_category_stage_idx"),
            models.Index(fields=["application_deadline"], name="projects_deadline_idx"),
        ]

    def clean(self) -> None:
        super().clean()
        city = self.city
        if city and self.country_id and city.country_id != self.country_id:
            raise ValidationError({"city": "City must belong to the selected country."})

    def is_publishable(self) -> bool:
        return bool(
            self.title
            and self.description
            and self.category_id
            and self.work_format_id
            and self.working_language_id
            and self.roles.filter(deleted_at__isnull=True, status=ProjectRole.Status.OPEN).exists()
        )

    def __str__(self) -> str:
        return self.title


class ProjectFocus(SoftDeleteModel):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="focuses")
    focus_area = models.ForeignKey(
        FocusArea,
        on_delete=models.PROTECT,
        related_name="project_focuses",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "focus_area"],
                condition=Q(deleted_at__isnull=True),
                name="projects_unique_active_focus",
            ),
        ]


class ProjectSkill(SoftDeleteModel):
    class Importance(models.TextChoices):
        NICE_TO_HAVE = "nice_to_have", "Nice to have"
        REQUIRED = "required", "Required"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="skills")
    skill = models.ForeignKey(Skill, on_delete=models.PROTECT, related_name="project_skills")
    importance = models.CharField(choices=Importance.choices, max_length=16)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "skill"],
                condition=Q(deleted_at__isnull=True),
                name="projects_unique_active_skill",
            ),
        ]


class ProjectRole(SoftDeleteModel):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        PAUSED = "paused", "Paused"
        FILLED = "filled", "Filled"
        CLOSED = "closed", "Closed"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="roles")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    first_responsibility = models.CharField(max_length=500, blank=True)
    commitment_hours_per_week = models.PositiveSmallIntegerField(blank=True, null=True)
    seats_total = models.PositiveSmallIntegerField(default=1)
    seats_filled = models.PositiveSmallIntegerField(default=0)
    status = models.CharField(choices=Status.choices, default=Status.OPEN, max_length=16)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(seats_total__gte=1)
                    & Q(seats_filled__gte=0)
                    & Q(seats_filled__lte=F("seats_total"))
                ),
                name="projects_role_valid_seat_counts",
            ),
        ]
        indexes = [models.Index(fields=["project", "status"])]
        ordering = ("sort_order", "created_at")


class ProjectMember(SoftDeleteModel):
    class MembershipRole(models.TextChoices):
        OWNER = "owner", "Owner"
        LEAD = "lead", "Lead"
        CONTRIBUTOR = "contributor", "Contributor"
        ADVISOR = "advisor", "Advisor"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        LEFT = "left", "Left"
        REMOVED = "removed", "Removed"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="members")
    profile = models.ForeignKey(
        Profile,
        on_delete=models.PROTECT,
        related_name="project_memberships",
    )
    project_role = models.ForeignKey(
        ProjectRole,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="members",
    )
    membership_role = models.CharField(choices=MembershipRole.choices, max_length=16)
    status = models.CharField(choices=Status.choices, default=Status.ACTIVE, max_length=16)
    joined_at = models.DateTimeField(default=timezone.now)
    left_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "profile"],
                condition=Q(deleted_at__isnull=True, status="active"),
                name="projects_unique_active_member",
            ),
        ]


class ProjectContact(SoftDeleteModel):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="contacts")
    name = models.CharField(max_length=160)
    email = models.EmailField()
    role_label = models.CharField(max_length=160, blank=True)
    is_public = models.BooleanField(default=False)
