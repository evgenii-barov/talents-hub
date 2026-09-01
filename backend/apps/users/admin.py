from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import ExternalIdentity, LegalAcceptance, User, UserRole


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    ordering = ("email",)
    list_display = ("email", "first_name", "last_name", "is_staff")
    search_fields = ("email", "first_name", "last_name")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "password1", "password2")}),
    )


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "created_at")
    list_filter = ("role",)
    search_fields = ("user__email",)


@admin.register(ExternalIdentity)
class ExternalIdentityAdmin(admin.ModelAdmin):
    list_display = ("user", "provider", "provider_account_id", "linked_at")
    list_filter = ("provider",)
    search_fields = ("user__email", "provider_account_id", "email_at_provider")


@admin.register(LegalAcceptance)
class LegalAcceptanceAdmin(admin.ModelAdmin):
    list_display = ("user", "document", "version", "source", "created_at", "withdrawn_at")
    list_filter = ("document", "version", "source")
    search_fields = ("user__email",)
    readonly_fields = (
        "user",
        "document",
        "version",
        "source",
        "evidence",
        "created_at",
        "updated_at",
        "withdrawn_at",
    )
