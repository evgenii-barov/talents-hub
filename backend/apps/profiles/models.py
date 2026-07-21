from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q

from apps.common.models import PublicationStatus, PublishableModel, SoftDeleteModel
from apps.media.models import MediaAsset
from apps.taxonomy.models import (
    Category,
    City,
    Country,
    EducationLevel,
    FocusArea,
    Language,
    Skill,
    WorkFormat,
)


class ProfileQuerySet(models.QuerySet["Profile"]):
    def public(self) -> "ProfileQuerySet":
        return self.filter(
            deleted_at__isnull=True,
            status=PublicationStatus.PUBLISHED,
            visibility=Profile.Visibility.PUBLIC,
        )


class Profile(PublishableModel):
    class Visibility(models.TextChoices):
        PRIVATE = "private", "Private"
        MEMBERS = "members", "Members"
        PUBLIC = "public", "Public"

    class Availability(models.TextChoices):
        AVAILABLE = "available", "Available"
        LIMITED = "limited", "Limited"
        UNAVAILABLE = "unavailable", "Unavailable"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    slug = models.SlugField(max_length=160)
    display_name = models.CharField(max_length=160)
    headline = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    country = models.ForeignKey(
        Country,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="profiles",
    )
    city = models.ForeignKey(
        City,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="profiles",
    )
    avatar = models.ForeignKey(
        MediaAsset,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="profile_avatars",
    )
    visibility = models.CharField(
        choices=Visibility.choices,
        default=Visibility.PRIVATE,
        max_length=16,
    )
    availability = models.CharField(
        choices=Availability.choices,
        default=Availability.UNAVAILABLE,
        max_length=16,
    )
    availability_note = models.CharField(max_length=255, blank=True)
    remote_preference = models.ForeignKey(
        WorkFormat,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="profiles",
    )
    timezone = models.CharField(default="Europe/Moscow", max_length=64)
    is_verified = models.BooleanField(default=False)

    objects = ProfileQuerySet.as_manager()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["slug"],
                condition=Q(deleted_at__isnull=True),
                name="profiles_unique_active_slug",
            ),
        ]
        indexes = [
            models.Index(fields=["status", "published_at"], name="profiles_status_published_idx"),
            models.Index(fields=["visibility"], name="profiles_visibility_idx"),
            models.Index(fields=["country", "city"], name="profiles_location_idx"),
        ]

    def clean(self) -> None:
        super().clean()
        city = self.city
        if city and self.country_id and city.country_id != self.country_id:
            raise ValidationError({"city": "City must belong to the selected country."})

    def __str__(self) -> str:
        return self.display_name


class ProfileSkill(SoftDeleteModel):
    class Level(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"
        EXPERT = "expert", "Expert"

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="skills")
    skill = models.ForeignKey(Skill, on_delete=models.PROTECT, related_name="profile_skills")
    level = models.CharField(choices=Level.choices, max_length=16, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["profile", "skill"],
                condition=Q(deleted_at__isnull=True),
                name="profiles_unique_active_profile_skill",
            ),
            models.UniqueConstraint(
                fields=["profile"],
                condition=Q(deleted_at__isnull=True, is_primary=True),
                name="profiles_one_primary_skill",
            ),
        ]
        ordering = ("sort_order", "created_at")


class ProfileLanguage(SoftDeleteModel):
    class Proficiency(models.TextChoices):
        NATIVE = "native", "Native"
        A1 = "a1", "A1"
        A2 = "a2", "A2"
        B1 = "b1", "B1"
        B2 = "b2", "B2"
        C1 = "c1", "C1"
        C2 = "c2", "C2"

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="languages")
    language = models.ForeignKey(
        Language,
        on_delete=models.PROTECT,
        related_name="profile_languages",
    )
    proficiency = models.CharField(choices=Proficiency.choices, max_length=16)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["profile", "language"],
                condition=Q(deleted_at__isnull=True),
                name="profiles_unique_active_profile_language",
            ),
            models.UniqueConstraint(
                fields=["profile"],
                condition=Q(deleted_at__isnull=True, is_primary=True),
                name="profiles_one_primary_language",
            ),
        ]
        ordering = ("sort_order", "created_at")


class ProfileExperience(SoftDeleteModel):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="experiences")
    organization_name = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    location_text = models.CharField(max_length=255, blank=True)
    work_format = models.ForeignKey(
        WorkFormat,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="profile_experiences",
    )
    started_on = models.DateField()
    ended_on = models.DateField(blank=True, null=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(is_current=False) | Q(ended_on__isnull=True),
                name="profiles_current_experience_has_no_end_date",
            ),
            models.CheckConstraint(
                condition=Q(ended_on__isnull=True) | Q(ended_on__gte=F("started_on")),
                name="profiles_experience_end_not_before_start",
            ),
        ]
        ordering = ("sort_order", "-started_on")


class ProfileEducation(SoftDeleteModel):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="education")
    institution_name = models.CharField(max_length=255)
    degree = models.CharField(max_length=255, blank=True)
    field_of_study = models.CharField(max_length=255, blank=True)
    education_level = models.ForeignKey(
        EducationLevel,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="profile_educations",
    )
    started_on = models.DateField()
    ended_on = models.DateField(blank=True, null=True)
    credential_url = models.URLField(blank=True)
    is_verified = models.BooleanField(default=False)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(ended_on__isnull=True) | Q(ended_on__gte=F("started_on")),
                name="profiles_education_end_not_before_start",
            ),
        ]
        ordering = ("sort_order", "-started_on")


class ProfileLink(SoftDeleteModel):
    class Kind(models.TextChoices):
        WEBSITE = "website", "Website"
        LINKEDIN = "linkedin", "LinkedIn"
        PORTFOLIO = "portfolio", "Portfolio"
        GITHUB = "github", "GitHub"
        OTHER = "other", "Other"

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="links")
    kind = models.CharField(choices=Kind.choices, max_length=16)
    url = models.URLField(max_length=500)
    label = models.CharField(max_length=160, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("sort_order", "created_at")


class ProfileProjectPreference(SoftDeleteModel):
    profile = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name="project_preferences",
    )
    category = models.ForeignKey(
        Category,
        blank=True,
        null=True,
        on_delete=models.PROTECT,
        related_name="profile_preferences",
    )
    focus_area = models.ForeignKey(
        FocusArea,
        blank=True,
        null=True,
        on_delete=models.PROTECT,
        related_name="profile_preferences",
    )
    work_format = models.ForeignKey(
        WorkFormat,
        blank=True,
        null=True,
        on_delete=models.PROTECT,
        related_name="profile_preferences",
    )
    note = models.CharField(max_length=500, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(category__isnull=False)
                    | Q(focus_area__isnull=False)
                    | Q(work_format__isnull=False)
                ),
                name="profiles_preference_has_a_target",
            ),
        ]
        ordering = ("sort_order", "created_at")
