from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.common.models import PublicationStatus, PublishableModel, SoftDeleteModel
from apps.media.models import MediaAsset
from apps.taxonomy.models import City, Country, FocusArea


class OrganizationQuerySet(models.QuerySet["Organization"]):
    def public(self) -> "OrganizationQuerySet":
        return self.filter(
            deleted_at__isnull=True,
            status=PublicationStatus.PUBLISHED,
            visibility=Organization.Visibility.PUBLIC,
        )


class Organization(PublishableModel):
    class OrganizationType(models.TextChoices):
        NGO = "ngo", "NGO"
        EDUCATION = "education", "Education"
        BUSINESS = "business", "Business"
        GOVERNMENT = "government", "Government"
        COMMUNITY = "community", "Community"
        OTHER = "other", "Other"

    class Visibility(models.TextChoices):
        PRIVATE = "private", "Private"
        MEMBERS = "members", "Members"
        PUBLIC = "public", "Public"

    slug = models.SlugField(max_length=160)
    legal_name = models.CharField(max_length=255)
    display_name = models.CharField(max_length=160)
    organization_type = models.CharField(choices=OrganizationType.choices, max_length=16)
    tagline = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    website_url = models.URLField(blank=True)
    email = models.EmailField(blank=True)
    country = models.ForeignKey(
        Country,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="organizations",
    )
    city = models.ForeignKey(
        City,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="organizations",
    )
    location_text = models.CharField(max_length=255, blank=True)
    founded_year = models.PositiveSmallIntegerField(blank=True, null=True)
    logo = models.ForeignKey(
        MediaAsset,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="organization_logos",
    )
    visibility = models.CharField(
        choices=Visibility.choices,
        default=Visibility.PRIVATE,
        max_length=16,
    )
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(blank=True, null=True)

    objects = OrganizationQuerySet.as_manager()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["slug"],
                condition=Q(deleted_at__isnull=True),
                name="organizations_unique_active_slug",
            ),
        ]
        indexes = [
            models.Index(fields=["status", "published_at"], name="orgs_status_published_idx"),
            models.Index(fields=["country", "city"], name="orgs_location_idx"),
        ]

    def clean(self) -> None:
        super().clean()
        city = self.city
        if city and self.country_id and city.country_id != self.country_id:
            raise ValidationError({"city": "City must belong to the selected country."})

    def __str__(self) -> str:
        return self.display_name


class OrganizationFocus(SoftDeleteModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="focuses")
    focus_area = models.ForeignKey(
        FocusArea,
        on_delete=models.PROTECT,
        related_name="organization_focuses",
    )
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "focus_area"],
                condition=Q(deleted_at__isnull=True),
                name="organizations_unique_active_focus",
            ),
        ]
        ordering = ("sort_order", "created_at")


class OrganizationMembership(SoftDeleteModel):
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        ADMIN = "admin", "Admin"
        EDITOR = "editor", "Editor"
        MEMBER = "member", "Member"

    class Status(models.TextChoices):
        INVITED = "invited", "Invited"
        ACTIVE = "active", "Active"
        SUSPENDED = "suspended", "Suspended"
        LEFT = "left", "Left"

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organization_memberships",
    )
    role = models.CharField(choices=Role.choices, max_length=16)
    status = models.CharField(choices=Status.choices, default=Status.INVITED, max_length=16)
    title = models.CharField(max_length=160, blank=True)
    joined_at = models.DateTimeField(blank=True, null=True)
    left_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "user"],
                condition=Q(deleted_at__isnull=True, status="active"),
                name="organizations_unique_active_membership",
            ),
        ]
        indexes = [models.Index(fields=["organization", "status"])]
