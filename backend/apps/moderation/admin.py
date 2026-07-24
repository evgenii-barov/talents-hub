from django.contrib import admin

from .models import ModerationCase


@admin.register(ModerationCase)
class ModerationCaseAdmin(admin.ModelAdmin):
    list_display = ("content_type", "object_id", "status", "reporter", "assigned_to", "opened_at")
    list_filter = ("status", "content_type")
    search_fields = ("object_id", "reporter__email", "assigned_to__email", "reason_code")
    readonly_fields = ("opened_at", "resolved_at", "created_at", "updated_at")
