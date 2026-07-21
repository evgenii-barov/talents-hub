from django.contrib import admin

from .models import Organization, OrganizationFocus, OrganizationMembership


class OrganizationFocusInline(admin.TabularInline):
    model = OrganizationFocus
    extra = 0


class OrganizationMembershipInline(admin.TabularInline):
    model = OrganizationMembership
    extra = 0


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("display_name", "organization_type", "status", "visibility", "is_verified")
    list_filter = ("organization_type", "status", "visibility", "is_verified")
    search_fields = ("display_name", "legal_name", "slug", "email")
    inlines = (OrganizationFocusInline, OrganizationMembershipInline)


@admin.register(OrganizationMembership)
class OrganizationMembershipAdmin(admin.ModelAdmin):
    list_display = ("organization", "user", "role", "status", "joined_at")
    list_filter = ("role", "status")
    search_fields = ("organization__display_name", "user__email")
