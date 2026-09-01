from typing import TYPE_CHECKING, Any, ClassVar, cast

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

from apps.common.models import UUIDTimestampedModel

if TYPE_CHECKING:
    from apps.profiles.models import Profile


class UserManager(BaseUserManager["User"]):
    use_in_migrations = True

    def create_user(
        self, email: str, password: str | None = None, **extra_fields: Any
    ) -> "User":
        if not email:
            raise ValueError("The email address is required")
        email = self.normalize_email(email)
        user = cast("User", self.model(email=email, **extra_fields))
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self, email: str, password: str | None = None, **extra_fields: Any
    ) -> "User":
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Platform identity; domain profile data will live in the profiles app."""

    username = None  # type: ignore[assignment]
    email = models.EmailField("email address", unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: ClassVar[list[str]] = []

    objects = UserManager()  # type: ignore[misc, assignment]

    if TYPE_CHECKING:
        profile: "Profile"


class UserRole(UUIDTimestampedModel):
    class Role(models.TextChoices):
        TALENT = "talent", "Talent"
        PROJECT_LEAD = "project_lead", "Project lead"
        ORGANIZATION_MEMBER = "organization_member", "Organization member"
        MODERATOR = "moderator", "Moderator"
        ADMIN = "admin", "Admin"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="roles")
    role = models.CharField(choices=Role.choices, max_length=32)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "role"], name="users_unique_user_role"),
        ]


class ExternalIdentity(UUIDTimestampedModel):
    """Provider identity without copying OAuth tokens from django-allauth."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="external_identities")
    provider = models.CharField(max_length=64)
    provider_account_id = models.CharField(max_length=255)
    email_at_provider = models.EmailField(blank=True)
    linked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "provider_account_id"],
                name="users_unique_external_provider_account",
            ),
        ]
        indexes = [models.Index(fields=["user", "provider"])]


class LegalAcceptance(UUIDTimestampedModel):
    """Versioned evidence of a user's legal acceptance or consent."""

    class Document(models.TextChoices):
        TERMS = "terms", "User terms"
        PERSONAL_DATA = "personal_data", "Personal data consent"
        AGE_CONFIRMATION = "age_confirmation", "Age confirmation"
        PUBLIC_PROFILE = "public_profile", "Public profile distribution consent"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="legal_acceptances")
    document = models.CharField(choices=Document.choices, max_length=32)
    version = models.CharField(max_length=32)
    source = models.CharField(default="web", max_length=32)
    evidence = models.JSONField(blank=True, default=dict)
    withdrawn_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                condition=models.Q(withdrawn_at__isnull=True),
                fields=["user", "document"],
                name="users_unique_active_legal_acceptance",
            ),
        ]
        indexes = [models.Index(fields=["user", "document", "version"])]
