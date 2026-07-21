from django.contrib import admin

from .models import ProjectApplication


@admin.register(ProjectApplication)
class ProjectApplicationAdmin(admin.ModelAdmin):
    list_display = ("project_role", "applicant", "status", "submitted_at", "reviewed_at")
    list_filter = ("status",)
    search_fields = ("project_role__project__title", "project_role__title", "applicant__email")
    readonly_fields = ("submitted_at", "reviewed_at", "withdrawn_at")
