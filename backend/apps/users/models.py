from typing import Any, ClassVar, cast

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

from apps.common.models import UUIDTimestampedModel


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
