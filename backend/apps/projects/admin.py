from django.contrib import admin

from .models import Project, ProjectContact, ProjectFocus, ProjectMember, ProjectRole, ProjectSkill


class ProjectFocusInline(admin.TabularInline):
    model = ProjectFocus
    extra = 0


class ProjectSkillInline(admin.TabularInline):
    model = ProjectSkill
    extra = 0


class ProjectRoleInline(admin.TabularInline):
    model = ProjectRole
    extra = 0


class ProjectContactInline(admin.TabularInline):
    model = ProjectContact
    extra = 0


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "stage", "status", "application_deadline", "is_featured")
    list_filter = ("stage", "status", "scope", "is_featured")
    search_fields = ("title", "slug", "owner__email", "organization__display_name")
    inlines = (ProjectFocusInline, ProjectSkillInline, ProjectRoleInline, ProjectContactInline)


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ("project", "profile", "membership_role", "status", "joined_at")
    list_filter = ("membership_role", "status")
