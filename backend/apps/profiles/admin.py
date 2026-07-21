from django.contrib import admin

from .models import (
    Profile,
    ProfileEducation,
    ProfileExperience,
    ProfileLanguage,
    ProfileLink,
    ProfileProjectPreference,
    ProfileSkill,
)


class ProfileSkillInline(admin.TabularInline):
    model = ProfileSkill
    extra = 0


class ProfileLanguageInline(admin.TabularInline):
    model = ProfileLanguage
    extra = 0


class ProfileExperienceInline(admin.StackedInline):
    model = ProfileExperience
    extra = 0


class ProfileEducationInline(admin.StackedInline):
    model = ProfileEducation
    extra = 0


class ProfileLinkInline(admin.TabularInline):
    model = ProfileLink
    extra = 0


class ProfileProjectPreferenceInline(admin.TabularInline):
    model = ProfileProjectPreference
    extra = 0


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("display_name", "user", "visibility", "status", "is_verified", "updated_at")
    list_filter = ("visibility", "status", "is_verified", "availability")
    search_fields = ("display_name", "headline", "user__email", "slug")
    readonly_fields = ("created_at", "updated_at", "published_at", "moderated_at")
    inlines = (
        ProfileSkillInline,
        ProfileLanguageInline,
        ProfileExperienceInline,
        ProfileEducationInline,
        ProfileLinkInline,
        ProfileProjectPreferenceInline,
    )
